import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Reporter } from './reporter.js';
import { checkAnswerSpec, checkCommon, containsNumber, type ProblemLike } from './checks.js';

function quiet(): Reporter {
  const r = new Reporter();
  r.maxPrint = 0; // テスト中はコンソールに詳細を出さない
  return r;
}

const base = (over: Partial<ProblemLike>): ProblemLike => ({
  skillId: 's',
  prompt: '3 と 4 を たすと？',
  explain: '3 ＋ 4 ＝ 7 です',
  label: '3+4',
  signature: 's|3|4',
  hints: ['たし算です', '3 の つぎの数から かぞえよう', '答えは 7'],
  answer: { kind: 'number', correct: 7 },
  ...over,
});

test('containsNumber は独立した数だけを拾う', () => {
  assert.equal(containsNumber('答えは 150 です', 50), false);
  assert.equal(containsNumber('答えは 50 です', 50), true);
  assert.equal(containsNumber('2.5 cm', 2.5), true);
  assert.equal(containsNumber('25 cm', 2.5), false);
});

test('正常な number 問題は失敗0', () => {
  const r = quiet();
  const p = base({});
  checkCommon(r, 's', p);
  checkAnswerSpec(r, 's', p);
  assert.equal(r.failures, 0);
});

test('答えが問題文に出ている・ヒント1が答えを言う・診断が正答に反応する を検出', () => {
  const r = quiet();
  const p = base({
    prompt: '7 に なるのは？',
    hints: ['答えは 7 だよ', 'x', 'y'],
    diagnose: () => 'まちがい',
  });
  checkAnswerSpec(r, 's', p);
  assert.equal(r.failures, 3);
});

test('負の答えは既定で失敗、allowNegative で許可', () => {
  const p = base({ answer: { kind: 'number', correct: -2 }, prompt: 'ひき算' });
  const r1 = quiet();
  checkAnswerSpec(r1, 's', p);
  assert.equal(r1.failures, 1);
  const r2 = quiet();
  checkAnswerSpec(r2, 's', p, { allowNegative: true });
  assert.equal(r2.failures, 0);
});

test('choice: 重複・index範囲外・少なすぎ', () => {
  const r = quiet();
  checkAnswerSpec(r, 's', base({ answer: { kind: 'choice', choices: ['a', 'a'], correct: 5 } }));
  assert.equal(r.failures, 3);
});

test('tableFill: 空欄なし・見せ値と正解の食いちがい', () => {
  const r = quiet();
  checkAnswerSpec(r, 's', base({
    answer: { kind: 'tableFill', xHeader: 'x', yHeader: 'y', xs: [1, 2], given: [2, 9], correct: [2, 4] },
  }));
  assert.equal(r.failures, 2);
});

test('exprBuild: 正解トークン不足・まちがいカード無し', () => {
  const r = quiet();
  checkAnswerSpec(r, 's', base({ answer: { kind: 'exprBuild', cards: ['□', '＋'], correct: ['□', '＋', '○'] } }));
  assert.equal(r.failures, 2);
});

test('未知の kind は素通し', () => {
  const r = quiet();
  checkAnswerSpec(r, 's', base({ answer: { kind: 'mystery' } }));
  assert.equal(r.failures, 0);
});
