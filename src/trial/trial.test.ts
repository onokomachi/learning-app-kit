import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  startClimb, answerClimb, pickClimbSkill, startEndless, answerEndless, pickEndless,
  summarize, predictScore, nextGain, mergeTrials, type TrialRecord, type TrialFloorDef,
} from './index.js';

const run = (answers: boolean[], floors = 7) =>
  answers.reduce((s, c) => answerClimb(s, 'k', c), startClimb(floors));

test('極限: 2問正解で次の層へ。同じ層で2回まちがえたら止まる', () => {
  let s = run([true, false, true]);          // 第Ⅰ層: 1ミスありで突破
  assert.equal(s.cleared, 1); assert.equal(s.at, 1);
  s = [false, false].reduce((x, c) => answerClimb(x, 'k', c), s);
  assert.equal(s.done, true); assert.equal(s.cleared, 1, '第Ⅱ層で止まる＝突破は1層');
});

test('極限: 第Ⅰ層で2回まちがえたら 0層', () => {
  const s = run([false, false]);
  assert.equal(s.done, true); assert.equal(s.cleared, 0);
});

test('極限: 2層続けてノーミスなら1層飛ばし、飛ばした層も突破に数える', () => {
  const s = run([true, true, true, true]);
  assert.deepEqual(s.skipped, [2]);
  assert.equal(s.at, 3); assert.equal(s.cleared, 3);
});

test('極限: 最後の層は飛ばさない（神座は必ず解いて届く）', () => {
  // 3層: Ⅰ・Ⅱをノーミス → 次はⅢ（最後の層）なので飛ばさない
  const s = run([true, true, true, true], 3);
  assert.deepEqual(s.skipped, []);
  assert.equal(s.at, 2);
  const end = answerClimb(answerClimb(s, 'k', true), 'k', true);
  assert.equal(end.done, true); assert.equal(end.cleared, 3, '全層突破＝神座');
});

test('極限: 同じ層では同じ問題の記号が続かない', () => {
  const defs: TrialFloorDef[] = [{ label: 'a', skills: ['x', 'y'] }];
  let s = startClimb(1);
  s = answerClimb(s, 'x', false);
  for (let i = 0; i < 20; i++) assert.equal(pickClimbSkill(s, defs), 'y');
});

test('無限: 3回まちがえたら終わる。進むほど上の層から出る', () => {
  let s = startEndless();
  for (let i = 0; i < 9; i++) s = answerEndless(s, 0, 'k', true);
  const defs: TrialFloorDef[] = Array.from({ length: 7 }, (_, i) => ({ label: String(i), skills: [`s${i}`] }));
  for (let i = 0; i < 30; i++) assert.ok(pickEndless(s, defs).floor >= 3, '9問正解したら第Ⅳ層より上だけ');
  s = [false, false, false].reduce((x, c) => answerEndless(x, 6, 'k', c), s);
  assert.equal(s.done, true); assert.equal(s.score, 9);
});

const rec = (floor: number, ts: number, over: Partial<TrialRecord> = {}): TrialRecord => ({
  eventId: `e${ts}`, ts, mode: '極限', floor, floors: 7, score: 0, soloComplete: true, ...over,
});

test('刻印: その層以上に通算3回届いたら付く（同じ日でもよい・途中の失敗をはさんでもよい）', () => {
  const s = summarize([rec(4, 1), rec(2, 2), rec(5, 3), rec(4, 4)], 7);
  assert.equal(s.sealed, 4, '4層以上が3回（4・5・4）');
  assert.equal(s.current, 4, '今の層は最新の結果');
  assert.equal(s.best, 5);
  assert.deepEqual(s.nextSeal, { floor: 5, count: 1 });
});

test('刻印: ペアや途中でやめた回（soloComplete=false）は数えない', () => {
  const s = summarize([rec(6, 1), rec(6, 2), rec(6, 3, { soloComplete: false })], 7);
  assert.equal(s.sealed, 0);
  assert.equal(s.best, 6, 'ベストには残る');
});

test('今の層は下がることもある（最新の結果をそのまま映す）', () => {
  const s = summarize([rec(5, 1), rec(5, 2), rec(5, 3), rec(2, 4)], 7);
  assert.equal(s.current, 2);
  assert.equal(s.sealed, 5, '刻印は消えない');
});

test('無限は神座に1度届いたら解放。記録は最高値', () => {
  const s = summarize([rec(7, 1), rec(0, 2, { mode: '無限', score: 12 }), rec(0, 3, { mode: '無限', score: 8 })], 7);
  assert.equal(s.endlessUnlocked, true);
  assert.equal(s.endlessBest, 12);
});

test('予想点: 突破した層で取れる設問の合計。次に点が上がる層と上がり幅', () => {
  const items = [{ points: 20, floor: 1 }, { points: 20, floor: 3 }, { points: 60, floor: 7 }];
  assert.equal(predictScore(items, 0), 0);
  assert.equal(predictScore(items, 3), 40);
  assert.deepEqual(nextGain(items, 3, 7), { floor: 7, gain: 60 }, '点の上がらない層は飛ばして次を示す');
  assert.equal(nextGain(items, 7, 7), null);
});

test('サーバの記録と端末の記録を合わせる（同じ回は1つ）', () => {
  const m = mergeTrials([rec(3, 5, { sent: false })], [rec(3, 5), rec(2, 1)]);
  assert.equal(m.length, 2);
  assert.equal(m.find((r) => r.ts === 5)!.sent, true);
});

test('本番テストから層を組む: 設問の順・同じモジュールはまとめる・予想点の対応', async () => {
  const { floorsFromTestSteps, floorName } = await import('./index.js');
  const steps = [
    { skillId: 'meaning-man', points: 5, title: 'がい数の いみ（約何万）' },
    { skillId: 'meaning-man', points: 5, title: 'がい数の いみ（約何万）' },
    { skillId: 'round-place', points: 5, title: '四捨五入（千の位）' },
    { skillId: 'round-digit2', points: 5, title: '上から2けたの がい数' },
    { skillId: 'range-hundreds', points: 15, title: 'もとの数の はんい' },
    { skillId: 'sumdiff-add', points: 10, title: 'たし算の 見積もり' },
    { skillId: 'meaning-scene', points: 0, title: '参考' },
  ];
  const plan = floorsFromTestSteps(steps);
  assert.deepEqual(plan.floors.map((f) => f.skills), [['meaning-man'], ['round-place', 'round-digit2'], ['range-hundreds'], ['sumdiff-add']]);
  assert.equal(plan.floors[0]!.label, 'がい数の いみ');
  assert.equal(plan.max, 45, '点のない参考問題は数えない');
  assert.deepEqual(plan.reqs.map((r) => r.floor), [1, 1, 2, 2, 3, 4]);
  const many = Array.from({ length: 12 }, (_, i) => ({ skillId: `m${i}-a`, points: 5, title: `t${i}` }));
  assert.equal(floorsFromTestSteps(many).floors.length, 8, '多すぎるときは となり同士を まとめる');
  assert.equal(floorName(0, 7), '第Ⅰ層に挑戦中');
  assert.equal(floorName(3, 7), '第Ⅲ層');
  assert.equal(floorName(7, 7), '神座');
});
