import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const BIN = resolve('bin/platform.mjs');
const run = (cwd: string, mode: string) => spawnSync(process.execPath, [BIN, mode], { cwd, encoding: 'utf8' });

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
