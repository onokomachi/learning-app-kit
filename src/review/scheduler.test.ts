import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY_MS,
  DEFAULT_INTERVALS_DAYS,
  daysUntilDue,
  getDueSkills,
  inferInitialState,
  isDue,
  scheduleAfterResult,
} from './scheduler.js';

const T0 = 1_000_000_000_000;

test('初回正解は box 0（翌日に復習）', () => {
  const s = scheduleAfterResult(undefined, true, { now: T0 });
  assert.equal(s.box, 0);
  assert.equal(s.lastTs, T0);
  assert.equal(s.nextDueTs, T0 + 1 * DAY_MS);
});

test('連続正解で間隔が 1→3→7→14→30 と伸び、上限で止まる', () => {
  let s = scheduleAfterResult(undefined, true, { now: T0 });
  const expect = DEFAULT_INTERVALS_DAYS;
  for (let i = 1; i < expect.length + 2; i++) {
    const now = s.nextDueTs;
    s = scheduleAfterResult(s, true, { now });
    const box = Math.min(i, expect.length - 1);
    assert.equal(s.box, box);
    assert.equal(s.nextDueTs, now + (expect[box] ?? 0) * DAY_MS);
  }
});

test('ミスすると box 0 に戻る', () => {
  let s = scheduleAfterResult(undefined, true, { now: T0 });
  s = scheduleAfterResult(s, true, { now: T0 + DAY_MS });
  assert.equal(s.box, 1);
  s = scheduleAfterResult(s, false, { now: T0 + 4 * DAY_MS });
  assert.equal(s.box, 0);
  assert.equal(s.nextDueTs, T0 + 5 * DAY_MS);
});

test('isDue / daysUntilDue', () => {
  const s = scheduleAfterResult(undefined, true, { now: T0 });
  assert.equal(isDue(s, T0), false);
  assert.equal(isDue(s, T0 + DAY_MS), true);
  assert.equal(isDue(undefined, T0 + DAY_MS), false);
  assert.equal(daysUntilDue(s, T0), 1);
  assert.equal(daysUntilDue(s, T0 + 3 * DAY_MS), -2);
});

test('getDueSkills は期限超過が大きい順、limit で打ち切り、未着手は除外', () => {
  const states = {
    a: scheduleAfterResult(undefined, true, { now: T0 }), // due at T0+1d
    b: scheduleAfterResult(undefined, true, { now: T0 - 5 * DAY_MS }), // due at T0-4d（超過大）
    c: scheduleAfterResult(undefined, true, { now: T0 + 10 * DAY_MS }), // まだ先
    d: undefined,
  };
  const now = T0 + 2 * DAY_MS;
  const due = getDueSkills(states, { now });
  assert.deepEqual(due.map((x) => x.skillId), ['b', 'a']);
  assert.equal(getDueSkills(states, { now, limit: 1 })[0]?.skillId, 'b');
});

test('inferInitialState: 習熟度から箱を推定し、lastTs から次回を計算', () => {
  const hi = inferInitialState({ attempts: 10, corrects: 10, perfectStreak: 5 }, T0);
  assert.equal(hi.box, 2);
  assert.equal(hi.nextDueTs, T0 + 7 * DAY_MS);
  const mid = inferInitialState({ attempts: 10, corrects: 8 }, T0);
  assert.equal(mid.box, 1);
  const lo = inferInitialState({ attempts: 4, corrects: 1 }, T0);
  assert.equal(lo.box, 0);
  // lastTs が不明（0）なら now を基準にする
  const unknown = inferInitialState({ attempts: 1, corrects: 1 }, 0, { now: T0 });
  assert.equal(unknown.lastTs, T0);
});
