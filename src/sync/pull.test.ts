import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchMyProgress, dueFromRows, type MySkillRow } from './pull.js';

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
