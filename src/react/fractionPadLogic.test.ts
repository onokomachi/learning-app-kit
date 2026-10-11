import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toInt, toInt0, multiplesOf, sharedCircled, scaleFactor, applyDivisor, reduceChain, borrowOne, divCheck,
} from './fractionPadLogic.js';

test('toInt: 1以上の整数だけ。toInt0 は 0 も', () => {
  assert.equal(toInt('12'), 12);
  assert.equal(toInt(''), null);
  assert.equal(toInt('0'), null);
  assert.equal(toInt('1.5'), null);
  assert.equal(toInt0('0'), 0);
  assert.equal(toInt0(''), null);
});

test('倍数ならべ: 小さい順、○が両方についた数だけ共通', () => {
  assert.deepEqual(multiplesOf(4, 4), [4, 8, 12, 16]);
  assert.deepEqual(multiplesOf(6, 3), [6, 12, 18]);
  assert.deepEqual(sharedCircled([12, 4, 8], [18, 12, 6]), [12]);
  assert.deepEqual(sharedCircled([4], [6]), []);
});

test('通分の ×k: 倍数でなければ null', () => {
  assert.equal(scaleFactor(3, 12), 4);
  assert.equal(scaleFactor(4, 12), 3);
  assert.equal(scaleFactor(5, 12), null);
  assert.equal(scaleFactor(0, 12), null);
});

test('約分: どちらも わりきれる数だけ。理由を返す', () => {
  assert.deepEqual(applyDivisor(18, 24, 6), { ok: true, n: 3, d: 4 });
  const a = applyDivisor(18, 24, 4);
  assert.ok(!a.ok && a.reason.includes('18'));
  const b = applyDivisor(18, 25, 3);
  assert.ok(!b.ok && b.reason.includes('25'));
  const c = applyDivisor(7, 9, 2);
  assert.ok(!c.ok);
  assert.ok(!applyDivisor(4, 6, 1).ok);
});

test('約分をつづける: 2でわって、また 3でわる。失敗したらそこで止まる', () => {
  const r = reduceChain(36, 48, [2, 3, 5]);
  assert.deepEqual(r.stages.map((s) => `${s.n}/${s.d}`), ['36/48', '18/24', '6/8']);
  assert.deepEqual(reduceChain(36, 48, [12]).stages.map((s) => `${s.n}/${s.d}`), ['36/48', '3/4']);
});

test('くり下げ: 整数を1へらし、分数に d/d をたす。整数0は不可', () => {
  assert.deepEqual(borrowOne({ w: 3, n: 1, d: 4 }), { w: 2, n: 5, d: 4 });
  assert.deepEqual(borrowOne({ w: 2, n: 0, d: 3 }), { w: 1, n: 3, d: 3 });
  assert.equal(borrowOne({ w: 0, n: 1, d: 4 }), null);
});

test('わり算のたしかめ: d × q ＋ r', () => {
  assert.equal(divCheck(5, 3, 2), 17);
});
