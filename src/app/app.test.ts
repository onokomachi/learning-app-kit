import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommendStart, nextAdaptiveIndex, praiseClear, encourage, createSound } from './index.js';

test('recommendStart: 習熟したレベルを前から飛ばす（最後のレベルは飛ばさない）', () => {
  const m: Record<string, number> = { 'compare-basic': 0.9, 'compare-big': 0.8 };
  assert.equal(recommendStart((s) => m[s] ?? 0, ['compare-basic', 'compare-big']), 1);
  assert.equal(recommendStart((s) => m[s] ?? 0, ['compare-basic', 'compare-big', 'compare-x']), 2);
});

test('recommendStart: とちゅうに足りないレベルがあれば、そこから', () => {
  const m: Record<string, number> = { a: 0.9, b: 0.3, c: 0.9 };
  assert.equal(recommendStart((s) => m[s] ?? 0, ['a', 'b', 'c', 'd']), 1);
});

test('recommendStart: 記録の名前がレベルIDとちがうときは toSkillId で直して引く（hissan-2-1 など）', () => {
  const m: Record<string, number> = { 'hissan-2-1': 1 };
  assert.equal(recommendStart((s) => m[s] ?? 0, ['2-1', '2-2']), 0, 'そのままでは引けない');
  assert.equal(recommendStart((s) => m[s] ?? 0, ['2-1', '2-2'], (l) => `hissan-${l}`), 1);
});

test('recommendStart: 以前の不具合（prefix を二重に足す）を起こさない', () => {
  // レベルIDがすでに 'compare-basic' のとき、'compare-compare-basic' を引いてはいけない
  const asked: string[] = [];
  recommendStart((s) => { asked.push(s); return 1; }, ['compare-basic', 'compare-big']);
  assert.deepEqual(asked, ['compare-basic']);
});

test('nextAdaptiveIndex: 2問続けてノーミスで上へ、2問続けてミスで下へ', () => {
  let s = { index: 1, perfectRun: 0, missRun: 0, leveledUp: false };
  s = nextAdaptiveIndex(s, true, 3); assert.equal(s.index, 1);
  s = nextAdaptiveIndex(s, true, 3); assert.equal(s.index, 2); assert.equal(s.leveledUp, true);
  s = nextAdaptiveIndex(s, true, 3); s = nextAdaptiveIndex(s, true, 3);
  assert.equal(s.index, 2, 'いちばん上ではそれ以上あがらない'); assert.equal(s.leveledUp, false);
  s = nextAdaptiveIndex(s, false, 3); assert.equal(s.index, 2);
  s = nextAdaptiveIndex(s, false, 3); assert.equal(s.index, 1);
  s = nextAdaptiveIndex(s, true, 3); s = nextAdaptiveIndex(s, false, 3);
  assert.equal(s.index, 1, 'ノーミスとミスが交互なら動かない');
});

test('praiseClear / encourage は空でない文を返す', () => {
  assert.ok(praiseClear(true).length > 0);
  assert.ok(praiseClear(false).length > 0);
  assert.ok(encourage().length > 0);
});

test('createSound: 音がオフなら何もしない（Node でも例外にならない）', () => {
  const s = createSound(() => false);
  s.playCorrect(); s.playClear(); s.playLevelUp(); s.playSoftTry();
  const on = createSound(() => true);
  on.playClear(); // window が無い環境では鳴らさずに戻る
});
