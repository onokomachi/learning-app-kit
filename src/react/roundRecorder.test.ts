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

/* ---------- 1つの画面で問題を切りかえ続けるとき ---------- */

test('next: できないまま次へ移ったら、前の問題を「やめた」として残す', () => {
  const got: RoundRecord[] = [];
  let skill = 's1';
  const rec = createRoundRecorder(() => ({
    moduleId: 'eh', skillId: skill, record: (r) => got.push(r), abandonLabel: () => `label-${skill}`,
  }));
  rec.mistake();
  skill = 's2';                     // 画面はもう次の問題を描いている
  rec.next();
  assert.equal(got.length, 1);
  assert.equal(got[0]!.skillId, 's1', 'やめた記録が次の問題のものにならない');
  assert.equal(got[0]!.label, 'label-s1');
  assert.equal(got[0]!.abandoned, true);
});

test('next: 次の問題では数え直す', () => {
  const got: RoundRecord[] = [];
  const rec = createRoundRecorder(() => ({ moduleId: 'eh', skillId: 's', record: (r) => got.push(r) }));
  rec.mistake(); rec.mistake();
  rec.finish('1問目');
  rec.next();
  rec.finish('2問目');
  assert.equal(got.length, 2);
  assert.equal(got[0]!.mistakes, 2);
  assert.equal(got[1]!.mistakes, 0, '前の問題の誤答回数を引きずらない');
  assert.equal(got[1]!.correct, true);
});

test('next: できたあとに次へ移っても、やめた記録は増えない', () => {
  const got: RoundRecord[] = [];
  const rec = createRoundRecorder(() => ({ moduleId: 'eh', skillId: 's', record: (r) => got.push(r) }));
  rec.finish('できた');
  rec.next();
  rec.next();
  assert.equal(got.length, 1);
});

test('next: 1回も答えずに通りすぎた問題は残さない', () => {
  const got: RoundRecord[] = [];
  const rec = createRoundRecorder(() => ({ moduleId: 'eh', skillId: 's', record: (r) => got.push(r) }));
  rec.next(); rec.next(); rec.next();
  assert.equal(got.length, 0);
});

test('できたときの記録も、手をつけた時点の問題のものになる', () => {
  const got: RoundRecord[] = [];
  let skill = 's1';
  const rec = createRoundRecorder(() => ({ moduleId: 'm', skillId: skill, record: (r) => got.push(r) }));
  rec.mistake();
  skill = 's2';
  rec.finish('1問目');
  assert.equal(got[0]!.skillId, 's1');
});

test('まちがいの型と答え: 最初のまちがいだけが記録に残る', () => {
  const { rec, got } = make();
  rec.mistake({ type: '切り捨て', answer: 3400 });
  rec.mistake({ type: '位ちがい', answer: 3000 });   // 2回目は数だけ
  rec.finish('3456 → 百の位まで');
  assert.equal(got[0]!.mistakes, 2);
  assert.equal(got[0]!.missType, '切り捨て');
  assert.equal(got[0]!.missAnswer, '3400');
});

test('まちがいの型と答え: 渡さなければ今までどおり（記録に項目が増えない）', () => {
  const { rec, got } = make();
  rec.mistake();
  rec.finish('x');
  assert.deepEqual(Object.keys(got[0]!).sort(), ['correct', 'label', 'mistakes', 'moduleId', 'skillId']);
});

test('まちがいの型と答え: とちゅうでやめた記録にも残り、次の問題では消える', () => {
  const { rec, got } = make();
  rec.mistake({ type: 'ひく' });
  rec.next();                         // やめて次の問題へ
  rec.mistake();
  rec.finish('次の問題');
  assert.equal(got[0]!.abandoned, true);
  assert.equal(got[0]!.missType, 'ひく');
  assert.equal('missAnswer' in got[0]!, false, '答えを渡していなければ付かない');
  assert.equal('missType' in got[1]!, false, '前の問題の型を持ちこさない');
});

test('まちがいの型と答え: 最初のまちがいに情報が無ければ、あとの情報は使わない', () => {
  const { rec, got } = make();
  rec.mistake();
  rec.mistake({ type: '切り上げ' });
  rec.finish('x');
  assert.equal('missType' in got[0]!, false, '「最初の」まちがいの型ではないので残さない');
});
