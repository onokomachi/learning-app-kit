import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoundRecorder, type RoundRecord } from './roundRecorder.js';

function make(over: Record<string, unknown> = {}) {
  const got: RoundRecord[] = [];
  const rec = createRoundRecorder(() => ({
    moduleId: 'round', skillId: 'round-up', record: (r) => got.push(r), ...over,
  }));
  return { rec, got };
}

test('できたとき: まちがえた回数つきで1件記録する', () => {
  const { rec, got } = make();
  rec.mistake(); rec.mistake();
  rec.finish('32485 → 上から2けた');
  rec.leave();                       // できたあとに画面を離れても
  assert.equal(got.length, 1, '二重に記録しない');
  assert.deepEqual(got[0], {
    moduleId: 'round', skillId: 'round-up', label: '32485 → 上から2けた',
    correct: false, mistakes: 2,
  });
});

test('一発正解なら correct は true で mistakes は 0', () => {
  const { rec, got } = make();
  rec.finish('できた');
  assert.equal(got[0]!.correct, true);
  assert.equal(got[0]!.mistakes, 0);
});

test('できないまま離れたとき: とちゅうでやめた印をつけて残す', () => {
  // これが無いと「できなかった問題」ほど記録から消える
  const { rec, got } = make({ abandonLabel: () => '32485 → 上から2けた' });
  rec.mistake();
  rec.leave();
  assert.equal(got.length, 1);
  assert.equal(got[0]!.abandoned, true);
  assert.equal(got[0]!.correct, false);
  assert.equal(got[0]!.mistakes, 1);
  assert.equal(got[0]!.label, '32485 → 上から2けた');
});

test('1回も答えずに離れたときは記録しない（開いて閉じただけを数えない）', () => {
  const { rec, got } = make();
  rec.leave();
  assert.equal(got.length, 0);
});

test('recordUntouched を立てれば、触っていなくても残す', () => {
  const { rec, got } = make({ recordUntouched: true });
  rec.leave();
  assert.equal(got.length, 1);
  assert.equal(got[0]!.abandoned, true);
});

test('finish は何度呼んでも1件（連打やアニメの再入で増やさない）', () => {
  const { rec, got } = make();
  rec.finish('できた'); rec.finish('できた'); rec.finish('できた');
  assert.equal(got.length, 1);
});

test('leave を2回呼んでも1件', () => {
  const { rec, got } = make();
  rec.mistake();
  rec.leave(); rec.leave();
  assert.equal(got.length, 1);
});

test('本番テストの答案は detail として一緒に運ぶ', () => {
  const { rec, got } = make({ moduleId: 'mock-test', skillId: 'mock-test' });
  rec.finish('本番テスト 85/100点', { detail: { mode: '表', total: 85 } });
  assert.deepEqual(got[0]!.detail, { mode: '表', total: 85 });
});

test('count: いまの誤答回数を返す', () => {
  const { rec } = make();
  assert.equal(rec.count(), 0);
  rec.mistake(); rec.mistake();
  assert.equal(rec.count(), 2);
});
