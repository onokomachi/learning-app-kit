import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchMyProgress, dueFromRows, type MySkillRow, fetchMyActivity, streakDays, totalsBetween } from './pull.js';

const CFG = { supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k' };
const row = (o: Partial<MySkillRow>): MySkillRow => ({
  app_id: 'gaisu', skill_id: 's', attempts: 1, corrects: 1,
  perfect_streak: 0, box: null, next_due_ts: null, last_ts: null, ...o,
});

test('まだ名乗っていなければ、通信せずに空を返す', async () => {
  let called = false;
  (globalThis as any).fetch = async () => { called = true; return { ok: true } as any; };
  assert.deepEqual(await fetchMyProgress(CFG, null), { ok: true, rows: [] });
  assert.equal(called, false);
});

test('設定が無ければ、通信せずに空を返す', async () => {
  let called = false;
  (globalThis as any).fetch = async () => { called = true; return { ok: true } as any; };
  assert.deepEqual(await fetchMyProgress({}, 'stu-1'), { ok: true, rows: [] });
  assert.equal(called, false);
});

test('自分の児童IDを付けて取りに行く', async () => {
  let body: any = null, url = '';
  (globalThis as any).fetch = async (u: string, init: any) => {
    url = u; body = JSON.parse(init.body);
    return { ok: true, json: async () => [row({ skill_id: 'meaning-man' })] } as any;
  };
  const r = await fetchMyProgress(CFG, 'stu-1');
  assert.match(url, /\/rest\/v1\/rpc\/my_skill_state$/);
  assert.deepEqual(body, { p_student_id: 'stu-1' });
  assert.ok(r.ok && r.rows.length === 1);
});

test('ネットが落ちていても投げない', async () => {
  (globalThis as any).fetch = async () => { throw new Error('offline'); };
  const r = await fetchMyProgress(CFG, 'stu-1');
  assert.equal(r.ok, false);
});

test('配列でない応答が来ても壊れない', async () => {
  (globalThis as any).fetch = async () => ({ ok: true, json: async () => ({ oops: 1 }) }) as any;
  const r = await fetchMyProgress(CFG, 'stu-1');
  assert.deepEqual(r, { ok: true, rows: [] });
});

test('期限が来たものだけを、超過が大きい順に返す', () => {
  const now = 1000;
  const due = dueFromRows([
    row({ skill_id: 'a', next_due_ts: 900 }),   // 100 遅れ
    row({ skill_id: 'b', next_due_ts: 2000 }),  // まだ先
    row({ skill_id: 'c', next_due_ts: 500 }),   // 500 遅れ
    row({ skill_id: 'd', next_due_ts: null }),  // 予定なし
  ], now);
  assert.deepEqual(due.map((r) => r.skill_id), ['c', 'a']);
});

/* ---------- がんばった記録（連続日数） ---------- */

const act = (d: string) => ({ event_date: d, app_id: 'gaisu', attempts: 3, corrects: 2 });

test('streakDays: 今日から続いている日数を数える', () => {
  const rows = [act('2026-09-14'), act('2026-09-15'), act('2026-09-16')];
  assert.equal(streakDays(rows, '2026-09-16'), 3);
});

test('streakDays: 今日まだやっていなくても、昨日までの連続は途切れない', () => {
  // 夜に開いた子と朝に開いた子で見え方が変わらないようにするため
  const rows = [act('2026-09-14'), act('2026-09-15')];
  assert.equal(streakDays(rows, '2026-09-16'), 2);
});

test('streakDays: 間が空いていたら、そこで止める', () => {
  const rows = [act('2026-09-10'), act('2026-09-15'), act('2026-09-16')];
  assert.equal(streakDays(rows, '2026-09-16'), 2);
});

test('streakDays: 同じ日に複数の単元をやっても1日と数える', () => {
  const rows = [act('2026-09-16'), { ...act('2026-09-16'), app_id: 'suihei' }];
  assert.equal(streakDays(rows, '2026-09-16'), 1);
});

test('streakDays: 記録が無ければ0', () => {
  assert.equal(streakDays([], '2026-09-16'), 0);
});

test('streakDays: 2日以上空いていたら0（連続は切れている）', () => {
  assert.equal(streakDays([act('2026-09-10')], '2026-09-16'), 0);
});

test('fetchMyActivity: 名乗っていなければ空で返す（エラーにしない）', async () => {
  const r = await fetchMyActivity({ supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k' }, null);
  assert.deepEqual(r, { ok: true, rows: [] });
});

/* ---------- 期間の合計と、問題単位の正答率 ---------- */

const day2 = (d: string, a: number, c: number, m: number) =>
  ({ event_date: d, app_id: 'gaisu', attempts: a, corrects: c, mistakes: m });

test('totalsBetween: のべ解答数は「取り組んだ回数＋まちがえた回数」', () => {
  // 10問に取り組み、7問は一発正解、のこりで3回まちがえた → のべ13回答えて7回正解
  const t = totalsBetween([day2('2026-09-15', 10, 7, 3)], '2026-09-01', '2026-09-30');
  assert.equal(t.answers, 13);
  assert.equal(t.rate, 7 / 13);
});

test('totalsBetween: 範囲の外は数えない（両端は含む）', () => {
  const rows = [day2('2026-09-14', 5, 5, 0), day2('2026-09-15', 5, 4, 1), day2('2026-09-16', 5, 3, 2)];
  const t = totalsBetween(rows, '2026-09-15', '2026-09-16');
  assert.equal(t.attempts, 10);
  assert.equal(t.corrects, 7);
  assert.equal(t.mistakes, 3);
});

test('totalsBetween: 記録が無ければ正答率は null（0%と出さないため）', () => {
  const t = totalsBetween([], '2026-09-01', '2026-09-30');
  assert.equal(t.rate, null);
  assert.equal(t.answers, 0);
});

test('totalsBetween: mistakes が無い古い記録でも壊れない', () => {
  const t = totalsBetween([{ event_date: '2026-09-15', app_id: 'gaisu', attempts: 4, corrects: 4 }],
                          '2026-09-01', '2026-09-30');
  assert.equal(t.answers, 4);
  assert.equal(t.rate, 1);
});
