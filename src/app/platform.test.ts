import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const BIN = resolve('bin/platform.mjs');
const run = (cwd: string, mode: string, ...args: string[]) => spawnSync(process.execPath, [BIN, mode, ...args], { cwd, encoding: 'utf8' });

test('platform: 種類が無ければ止める', () => {
  const d = mkdtempSync(join(tmpdir(), 'plat-'));
  writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'x' }));
  assert.equal(run(d, 'check').status, 1);
});

test('platform: CLAUDE.md・共通ファイルのずれを見つけ、fix でそろえ、アプリだけの段は残す', () => {
  const d = mkdtempSync(join(tmpdir(), 'plat-'));
  writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'syo4-x', learningApp: { family: 'math' } }));
  writeFileSync(join(d, 'CLAUDE.md'), '# わり算\n\nこのアプリだけのこと\n');
  mkdirSync(join(d, 'src/lib'), { recursive: true });
  writeFileSync(join(d, 'src/lib/sound.ts'), '// 1つのアプリだけで直した\n');

  const before = run(d, 'check');
  assert.equal(before.status, 1);
  assert.match(before.stderr, /共通ルール部分/);
  assert.match(before.stderr, /src\/lib\/sound\.ts が kit の版とちがいます/);

  assert.equal(run(d, 'fix').status, 0);
  const md = readFileSync(join(d, 'CLAUDE.md'), 'utf8');
  assert.match(md, /このアプリだけのこと/, 'アプリだけの段は残る');
  assert.match(md, /platform:begin/);
  assert.equal(readFileSync(join(d, 'src/lib/sound.ts'), 'utf8'), readFileSync('platform/families/math/files/src/lib/sound.ts', 'utf8'));
  assert.ok(existsSync(join(d, 'src/components/shared/Keypad.tsx')));
  assert.equal(run(d, 'check').status, 0, 'fix のあとは通る');

  // 共通ルール部分だけを書きかえても、fix で戻る（アプリだけの段はそのまま）
  writeFileSync(join(d, 'CLAUDE.md'), md.replace('構成', '構成（手で書きかえ）'));
  assert.equal(run(d, 'check').status, 1);
  run(d, 'fix');
  assert.equal(readFileSync(join(d, 'CLAUDE.md'), 'utf8'), md);
});

test('platform: 引数がちがえば止まる', () => {
  const d = mkdtempSync(join(tmpdir(), 'plat-'));
  writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'x', learningApp: { family: 'standalone' } }));
  assert.equal(run(d, 'nope').status, 2);
  assert.equal(run(d, 'init').status, 2, 'init は種類が要る');
  assert.equal(run(d, 'init', 'rika').status, 2, '知らない種類は止める');
});

test('platform: init で新しいアプリが仕組みに入る（種類・CLAUDE.md・CI・scripts）', () => {
  const d = mkdtempSync(join(tmpdir(), 'plat-'));
  writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'syo5-taiseki', scripts: { build: 'vite build', lint: 'tsc --noEmit' } }));
  assert.equal(run(d, 'check').status, 1, '種類が無いうちは通らない');

  assert.equal(run(d, 'init', 'math').status, 0);
  const pkg = JSON.parse(readFileSync(join(d, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.learningApp, { family: 'math' });
  assert.equal(pkg.scripts.platform, 'learning-app-kit-platform check');
  assert.equal(pkg.scripts.prebuild, 'npm run platform', 'Vercel の build の前に点検が走る');
  assert.equal(pkg.scripts.check, 'npm run lint && npm run build');
  assert.match(readFileSync(join(d, 'CLAUDE.md'), 'utf8'), /種類: \*\*math\*\*[\s\S]*platform:begin/);
  assert.equal(readFileSync(join(d, '.github/workflows/check.yml'), 'utf8'), readFileSync('templates/workflows/check.yml', 'utf8'));
  assert.ok(existsSync(join(d, 'src/lib/useAdaptive.ts')));
  assert.equal(run(d, 'check').status, 0);
});

test('platform: CI と scripts のずれも見つけ、すでにある prebuild は残して前に足す', () => {
  const d = mkdtempSync(join(tmpdir(), 'plat-'));
  writeFileSync(join(d, 'package.json'), JSON.stringify({ name: 'x', learningApp: { family: 'portal' }, scripts: { build: 'vite build', check: 'npm run build', prebuild: 'node gen.js' } }));
  run(d, 'fix');
  assert.equal(run(d, 'check').status, 0);

  writeFileSync(join(d, '.github/workflows/check.yml'), '# 1つのアプリだけで直した\n');
  const pkg = JSON.parse(readFileSync(join(d, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.prebuild, 'npm run platform && node gen.js');
  assert.equal(pkg.scripts.check, 'npm run build', 'すでにある check は変えない');
  delete pkg.scripts.prebuild;
  writeFileSync(join(d, 'package.json'), JSON.stringify(pkg));
  const r = run(d, 'check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /check\.yml が kit の版とちがいます/);
  assert.match(r.stderr, /prebuild/);
  run(d, 'fix');
  assert.equal(run(d, 'check').status, 0);
});
