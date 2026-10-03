#!/usr/bin/env node
/**
 * 学級ポータルのルール点検。アプリのリポジトリで動かす（kit を npm で入れていれば使える）。
 *
 *   npx learning-app-kit-platform init <種類> … 新しいアプリを学級ポータルの仕組みに入れる（種類を書いて fix する）
 *   npx learning-app-kit-platform check       … 点検だけ（ずれがあれば終了コード1）
 *   npx learning-app-kit-platform fix         … kit の版にそろえる（CLAUDE.md のアプリだけの段は残す）
 *   npx learning-app-kit-platform watch       … kit の最新（GitHub の main）と見くらべる。遅れていれば終了コード1
 *   npx learning-app-kit-platform update      … kit を最新に上げて fix する（週1回の自動更新用。CI が PR にする）
 *
 * アプリの種類は package.json の "learningApp": { "family": "math" | "kokugo" | "portal" | "standalone" } で決める。
 * 見るもの（どの種類でも）:
 *   1. CLAUDE.md があり、共通ルールの部分（platform:begin〜end）が kit の版と同じか
 *   2. その種類の共通ファイルが kit の版と1文字もちがわないか
 *   3. CI（.github/workflows/check.yml）が kit の版と同じか
 *   4. package.json の scripts に platform と prebuild があるか（Vercel の build の前にこの点検が走り、
 *      ずれたままでは本番に出ない）
 * 共通ファイルを1つのアプリだけで直すと、直しがほかのアプリに届かない。それを CI・Vercel・各セッションで止めるための道具。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP = process.cwd();
const REPO = 'onokomachi/learning-app-kit';
const BEGIN = '<!-- platform:begin（learning-app-kit が配る。手で書きかえない。直すときは kit の platform/CLAUDE.common.md） -->';
const END = '<!-- platform:end -->';
const WORKFLOW = '.github/workflows/check.yml';
const SCRIPTS = { platform: 'learning-app-kit-platform check', prebuild: 'npm run platform' };
const USAGE = '使い方: learning-app-kit-platform init <種類> | check | fix | watch | update';

const mode = process.argv[2] ?? 'check';
if (!['init', 'check', 'fix', 'watch', 'update'].includes(mode)) {
  console.error(USAGE);
  process.exit(2);
}

const read = (p) => readFileSync(p, 'utf8');
const manifest = JSON.parse(read(join(KIT, 'platform', 'manifest.json')));
const common = read(join(KIT, 'platform', 'CLAUDE.common.md')).trimEnd();
const block = `${BEGIN}\n${common}\n${END}`;
const families = Object.keys(manifest.families);

const pkgPath = join(APP, 'package.json');
const pkg = JSON.parse(read(pkgPath));
const writePkg = () => writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

if (mode === 'init') {
  const want = process.argv[3];
  if (!families.includes(want)) {
    console.error(`種類を指定してください: learning-app-kit-platform init ${families.join(' | ')}`);
    for (const f of families) console.error(`  ${f} … ${manifest.families[f].label}`);
    process.exit(2);
  }
  pkg.learningApp = { ...pkg.learningApp, family: want };
  writePkg();
  console.log(`✓ package.json に種類（${want}）を書きました`);
}
const family = pkg.learningApp?.family;

// ---- kit の最新と見くらべる（watch / update）----
const pinnedSha = () => {
  const dep = pkg.dependencies?.['learning-app-kit'] ?? pkg.devDependencies?.['learning-app-kit'] ?? '';
  return dep.match(/archive\/([0-9a-f]{40})/)?.[1] ?? null;
};
const latestSha = async () => {
  // kit は公開リポジトリなので、トークンなしで最新を読める（Actions では GITHUB_TOKEN があれば使う）
  const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  const res = await fetch(`https://api.github.com/repos/${REPO}/commits/main`, { headers });
  const sha = res.ok ? (await res.json()).sha : null;
  if (!sha) { console.error('kit の最新が読めませんでした（ネットワークか GitHub API の回数制限）'); process.exit(2); }
  return sha;
};
const output = (k, v) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`); };

if (mode === 'watch' || mode === 'update') {
  const pinned = pinnedSha();
  if (!pinned) { console.error('✗ learning-app-kit がコミットの SHA で固定されていません'); process.exit(1); }
  const latest = await latestSha();
  if (pinned === latest) {
    console.log(`✓ kit は最新です（${latest.slice(0, 7)}）`);
    output('updated', 'false');
    process.exit(0);
  }
  if (mode === 'update') {
    const dev = !pkg.dependencies?.['learning-app-kit'];
    const spec = `learning-app-kit@https://github.com/${REPO}/archive/${latest}.tar.gz`;
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const inst = spawnSync(npm, ['install', '--no-audit', '--no-fund', dev ? '--save-dev' : '--save', spec], { cwd: APP, stdio: 'inherit' });
    if (inst.status !== 0) process.exit(1);
    // 入れなおした新しい kit の道具でそろえる（この道具は古い kit のもの）
    const fix = spawnSync(process.execPath, [join(APP, 'node_modules', 'learning-app-kit', 'bin', 'platform.mjs'), 'fix'], { cwd: APP, stdio: 'inherit' });
    if (fix.status !== 0) process.exit(1);
    console.log(`✓ kit を ${pinned.slice(0, 7)} → ${latest.slice(0, 7)} に上げました。npm run check を通してください。`);
    output('updated', 'true');
    output('sha', latest);
    process.exit(0);
  }
  const rawMain = async (path) => { const r = await fetch(`https://raw.githubusercontent.com/${REPO}/${latest}/${path}`); return r.ok ? r.text() : null; };
  const details = [];
  if (((await rawMain('platform/CLAUDE.common.md')) ?? '').trimEnd() !== common) details.push('共通ルール（CLAUDE.md の下の段）が新しくなっている');
  const m2 = JSON.parse((await rawMain('platform/manifest.json')) ?? '{"families":{}}');
  for (const f of m2.families[family]?.files ?? []) {
    const now = await rawMain(`platform/families/${family}/files/${f}`);
    const here = existsSync(join(APP, f)) ? read(join(APP, f)) : null;
    if (now !== here) details.push(`共通ファイル ${f} が新しくなっている`);
  }
  console.error(`✗ kit が最新より古い（このアプリ ${pinned.slice(0, 7)} → 最新 ${latest.slice(0, 7)}）。kit の直しがこのアプリに届いていません`);
  for (const d of details) console.error(`  - ${d}`);
  console.error('\n直し方: npx learning-app-kit-platform update → npm run check（GitHub の Actions なら週1回自動で PR になる）');
  process.exit(1);
}

// ---- 点検とそろえ（check / fix / init）----
const fixing = mode !== 'check';
const problems = [];
const fixed = [];

if (!family || !manifest.families[family]) {
  console.error(`✗ package.json に "learningApp": { "family": ${families.map((f) => `"${f}"`).join(' | ')} } がありません`);
  console.error('  新しいアプリなら: npx learning-app-kit-platform init <種類>');
  process.exit(1);
}

// 1. CLAUDE.md の共通ルール部分
const claudePath = join(APP, 'CLAUDE.md');
if (!existsSync(claudePath)) {
  problems.push('CLAUDE.md がありません');
  if (fixing) {
    writeFileSync(claudePath, `# ${pkg.name}\n\n学級ポータルの一部。種類: **${family}**。\n\n## このアプリだけのこと\n\n（このアプリだけのことをここに書く）\n\n${block}\n`);
    fixed.push('CLAUDE.md を作りました（上の段にこのアプリだけのことを書いてください）');
  }
} else {
  const cur = read(claudePath);
  const i = cur.indexOf('<!-- platform:begin');
  const j = cur.indexOf(END);
  const curBlock = i >= 0 && j > i ? cur.slice(i, j + END.length) : null;
  if (curBlock !== block) {
    problems.push(curBlock ? 'CLAUDE.md の共通ルール部分が kit の版とちがいます' : 'CLAUDE.md に共通ルール部分（platform:begin〜end）がありません');
    if (fixing) {
      const next = curBlock ? cur.replace(curBlock, block) : `${cur.trimEnd()}\n\n${block}\n`;
      writeFileSync(claudePath, next);
      fixed.push('CLAUDE.md の共通ルール部分を kit の版にそろえました');
    }
  }
}

// 2. 共通ファイル（種類ごと）と CI（全部の種類）
const files = [
  ...manifest.families[family].files.map((f) => [f, join(KIT, 'platform', 'families', family, 'files', f)]),
  [WORKFLOW, join(KIT, 'templates', 'workflows', 'check.yml')],
];
for (const [f, src] of files) {
  const want = read(src);
  const p = join(APP, f);
  const have = existsSync(p) ? read(p) : null;
  if (have === want) continue;
  problems.push(have === null ? `共通ファイル ${f} がありません` : `共通ファイル ${f} が kit の版とちがいます`);
  if (fixing) {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, want);
    fixed.push(`${f} を kit の版にそろえました`);
  }
}

// 3. package.json の scripts（platform と、build の前にそれを走らせる prebuild）
pkg.scripts ??= {};
let pkgChanged = false;
if (pkg.scripts.platform !== SCRIPTS.platform) {
  problems.push(`package.json の scripts.platform が "${SCRIPTS.platform}" ではありません`);
  pkg.scripts.platform = SCRIPTS.platform;
  pkgChanged = true;
}
const pre = pkg.scripts.prebuild;
if (!pre || !pre.startsWith(SCRIPTS.prebuild)) {
  problems.push(`package.json の scripts.prebuild が "${SCRIPTS.prebuild}" で始まっていません（Vercel の build の前に点検が走らない）`);
  pkg.scripts.prebuild = pre ? `${SCRIPTS.prebuild} && ${pre}` : SCRIPTS.prebuild;
  pkgChanged = true;
}
if (!pkg.scripts.check) {
  problems.push('package.json に scripts.check がありません');
  pkg.scripts.check = pkg.scripts.lint ? 'npm run lint && npm run build' : 'npm run build';
  pkgChanged = true;
}
if (fixing && pkgChanged) {
  writePkg();
  fixed.push('package.json の scripts（platform・prebuild・check）をそろえました');
}

const label = manifest.families[family].label;
if (fixing) {
  for (const m of fixed) console.log(`✓ ${m}`);
  console.log(fixed.length ? `\n${fixed.length} か所をそろえました（${label}）。差分を確かめて npm install のあと npm run check を通してください。` : `✓ そろっています（${label}）`);
  process.exit(0);
}
if (problems.length) {
  for (const m of problems) console.error(`✗ ${m}`);
  console.error(`\n共通ファイルはこのリポジトリで直さず、learning-app-kit の platform/ を直して kit を上げてください。`);
  console.error(`kit の版にそろえるだけなら: npx learning-app-kit-platform fix`);
  process.exit(1);
}
console.log(`✓ 学級ポータルのルールどおりです（${label}・共通ファイル ${manifest.families[family].files.length} 本・CI・CLAUDE.md）`);
