import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pushSkillState, createPusher } from './push.js';

function stubLocalStorage() {
  const map = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}
const CFG = { appId: 'hitotsunohana', supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k' };

test('設定が無ければ送らない（設定し忘れても壊れない）', async () => {
  stubLocalStorage();
  let called = false;
  (globalThis as any).fetch = async () => { called = true; return { ok: true } as any; };
  const r = await pushSkillState({ appId: 'x' }, [{ skill_id: 'q1', attempts: 1, corrects: 1 }]);
  assert.deepEqual(r, { ok: true, pushed: 0 });
  assert.equal(called, false);
});

test('RPCへ、device_key と app_id を付けて送る', async () => {
  stubLocalStorage();
  let body: any = null, url = '';
  (globalThis as any).fetch = async (u: string, init: any) => {
    url = u; body = JSON.parse(init.body);
    return { ok: true, status: 200, text: async () => '2' } as any;
  };
  const r = await pushSkillState(CFG, [
    { skill_id: 'q1', attempts: 3, corrects: 2 },
    { skill_id: 'q2', attempts: 1, corrects: 1, box: 2, last_ts: 100 },
  ]);
  assert.match(url, /\/rest\/v1\/rpc\/sync_skill_state$/);
  assert.equal(body.p_app_id, 'hitotsunohana');
  assert.ok(body.p_device_key);
  assert.equal(body.p_rows.length, 2);
  assert.equal(body.p_rows[0].perfect_streak, 0, '省略時は0で埋める');
  assert.equal(body.p_rows[0].box, null, '省略時は null で送る（欠落させない）');
  assert.deepEqual(r, { ok: true, pushed: 2 });
});

test('壊れた行だけ落として、正しい行は通す', async () => {
  stubLocalStorage();
  let body: any = null;
  (globalThis as any).fetch = async (_u: string, init: any) => {
    body = JSON.parse(init.body);
    return { ok: true, status: 200, text: async () => '1' } as any;
  };
  await pushSkillState(CFG, [
    { skill_id: '', attempts: 1, corrects: 1 },        // skill_id が空
    { skill_id: 'q2', attempts: 1, corrects: 5 },      // 正答が試行より多い
    { skill_id: 'q3', attempts: 2, corrects: 2 },      // 正しい
  ]);
  assert.equal(body.p_rows.length, 1);
  assert.equal(body.p_rows[0].skill_id, 'q3');
});

test('全部の行が壊れていたら送らない', async () => {
  stubLocalStorage();
  let called = false;
  (globalThis as any).fetch = async () => { called = true; return { ok: true } as any; };
  const r = await pushSkillState(CFG, [{ skill_id: '', attempts: 1, corrects: 1 }]);
  assert.deepEqual(r, { ok: true, pushed: 0 });
  assert.equal(called, false);
});

test('ネットが落ちていても投げない（学習を止めない）', async () => {
  stubLocalStorage();
  (globalThis as any).fetch = async () => { throw new Error('offline'); };
  const r = await pushSkillState(CFG, [{ skill_id: 'q1', attempts: 1, corrects: 1 }]);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'offline');
});

test('createPusher: 何度呼んでも最後の1回だけ送る', async () => {
  stubLocalStorage();
  let calls = 0, last: any = null;
  (globalThis as any).fetch = async (_u: string, init: any) => {
    calls++; last = JSON.parse(init.body);
    return { ok: true, status: 200, text: async () => '1' } as any;
  };
  const push = createPusher(CFG, 5);
  push([{ skill_id: 'q1', attempts: 1, corrects: 1 }]);
  push([{ skill_id: 'q1', attempts: 2, corrects: 2 }]);
  push([{ skill_id: 'q1', attempts: 3, corrects: 3 }]);
  assert.equal(calls, 0, 'まとめている間は送らない');
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(calls, 1, '1回だけ送る');
  assert.equal(last.p_rows[0].attempts, 3, '最後の状態を送る');
});
