#!/usr/bin/env node
/**
 * 学級ポータルのルール点検。アプリのリポジトリで動かす（kit を npm で入れていれば使える）。
 *
 *   npx learning-app-kit-platform check   … 点検だけ（ずれがあれば終了コード1）
 *   npx learning-app-kit-platform fix     … CLAUDE.md の共通ルール部分と共通ファイルを kit の版にそろえる
 *
 * アプリの種類は package.json の "learningApp": { "family": "math" | "kokugo" | "portal" | "standalone" } で決める。
 * 見るもの:
 *   1. CLAUDE.md があり、共通ルールの部分（platform:begin〜end）が kit の版と同じか
 *   2. その種類の共通ファイルが kit の版と1文字もちがわないか
 * 共通ファイルを1つのアプリだけで直すと、直しがほかのアプリに届かない。それを CI と各セッションで止めるための道具。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP = process.cwd();
const BEGIN = '<!-- platform:begin（learning-app-kit が配る。手で書きかえない。直すときは kit の platform/CLAUDE.common.md） -->';
const END = '<!-- platform:end -->';
const mode = process.argv[2] ?? 'check';
if (!['check', 'fix'].includes(mode)) {
  console.error('使い方: learning-app-kit-platform check | fix');
  process.exit(2);
}

const read = (p) => readFileSync(p, 'utf8');
const manifest = JSON.parse(read(join(KIT, 'platform', 'manifest.json')));
const common = read(join(KIT, 'platform', 'CLAUDE.common.md')).trimEnd();
const block = `${BEGIN}\n${common}\n${END}`;

const pkg = JSON.parse(read(join(APP, 'package.json')));
const family = pkg.learningApp?.family;
const problems = [];
const fixed = [];

if (!family || !manifest.families[family]) {
  console.error(`✗ package.json に "learningApp": { "family": ${Object.keys(manifest.families).map((f) => `"${f}"`).join(' | ')} } がありません`);
  process.exit(1);
}

// 1. CLAUDE.md の共通ルール部分
const claudePath = join(APP, 'CLAUDE.md');
if (!existsSync(claudePath)) {
  problems.push('CLAUDE.md がありません');
  if (mode === 'fix') {
    writeFileSync(claudePath, `# ${pkg.name}\n\n（このアプリだけのことをここに書く）\n\n${block}\n`);
    fixed.push('CLAUDE.md を作りました（上の段にこのアプリだけのことを書いてください）');
  }
} else {
  const cur = read(claudePath);
  const i = cur.indexOf('<!-- platform:begin');
  const j = cur.indexOf(END);
  const curBlock = i >= 0 && j > i ? cur.slice(i, j + END.length) : null;
  if (curBlock !== block) {
    problems.push(curBlock ? 'CLAUDE.md の共通ルール部分が kit の版とちがいます' : 'CLAUDE.md に共通ルール部分（platform:begin〜end）がありません');
    if (mode === 'fix') {
      const next = curBlock ? cur.replace(curBlock, block) : `${cur.trimEnd()}\n\n${block}\n`;
      writeFileSync(claudePath, next);
      fixed.push('CLAUDE.md の共通ルール部分を kit の版にそろえました');
    }
  }
}

// 2. 共通ファイル
for (const f of manifest.families[family].files) {
  const want = read(join(KIT, 'platform', 'families', family, 'files', f));
  const p = join(APP, f);
  const have = existsSync(p) ? read(p) : null;
  if (have === want) continue;
  problems.push(have === null ? `共通ファイル ${f} がありません` : `共通ファイル ${f} が kit の版とちがいます`);
  if (mode === 'fix') {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, want);
    fixed.push(`${f} を kit の版にそろえました`);
  }
}

const label = manifest.families[family].label;
if (mode === 'fix') {
  for (const m of fixed) console.log(`✓ ${m}`);
  console.log(fixed.length ? `\n${fixed.length} か所をそろえました（${label}）。差分を確かめて npm run check を通してください。` : `✓ そろっています（${label}）`);
  process.exit(0);
}
if (problems.length) {
  for (const m of problems) console.error(`✗ ${m}`);
  console.error(`\n共通ファイルはこのリポジトリで直さず、learning-app-kit の platform/ を直して kit を上げてください。`);
  console.error(`kit の版にそろえるだけなら: npx learning-app-kit-platform fix`);
  process.exit(1);
}
console.log(`✓ 学級ポータルのルールどおりです（${label}・共通ファイル ${manifest.families[family].files.length} 本・CLAUDE.md）`);
