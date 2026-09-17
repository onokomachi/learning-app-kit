import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getStudent, clearStudent, resolveStudent, getJoinChoice, chooseAnonymous, claimDevice,
} from './student.js';
import { pushSkillState, createPusher } from './push.js';
import { createSyncedStorage } from './storage.js';

function stubLS() {
  const map = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
  return map;
}
const CFG = { supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k' };

test('未入力なら null（まだ名乗っていない）', () => {
  stubLS();
  assert.equal(getStudent(), null);
});

test('学級コードと番号から児童IDを受け取り、端末に覚える', async () => {
  stubLS();
  let sent: any = null;
  (globalThis as any).fetch = async (_u: string, init: any) => {
    sent = JSON.parse(init.body);
    return { ok: true, json: async () => 'stu-123' } as any;
  };
  const r = await resolveStudent(CFG, ' 4-2 ', 12);
  assert.ok(r.ok);
  assert.deepEqual(sent, { p_join_code: '4-2', p_number: 12 }, '前後の空白は落として送る');
  assert.deepEqual(getStudent(), { studentId: 'stu-123', joinCode: '4-2', number: 12 });
});

test('サーバの拒否理由を、そのまま子どもに見せられる形で返す', async () => {
  stubLS();
  (globalThis as any).fetch = async () =>
    ({ ok: false, json: async () => ({ message: 'この学級に 99 番はありません' }) }) as any;
  const r = await resolveStudent(CFG, '4-2', 99);
  assert.equal(r.ok, false);
  assert.equal((r as { message: string }).message, 'この学級に 99 番はありません');
  assert.equal(getStudent(), null, '失敗したら覚えない');
});

test('入力が空なら、通信する前に止める', async () => {
  stubLS();
  let called = false;
  (globalThis as any).fetch = async () => { called = true; return { ok: true } as any; };
  assert.equal((await resolveStudent(CFG, '   ', 1)).ok, false);
  assert.equal((await resolveStudent(CFG, '4-2', 0)).ok, false);
  assert.equal(called, false);
});

test('ネットが落ちていても投げない', async () => {
  stubLS();
  (globalThis as any).fetch = async () => { throw new Error('offline'); };
  const r = await resolveStudent(CFG, '4-2', 1);
  assert.equal(r.ok, false);
  assert.match((r as { message: string }).message, /ネット/);
});

test('学級コードを入れていれば、学習記録に児童IDが付く', async () => {
  stubLS();
  (globalThis as any).fetch = async () => ({ ok: true, json: async () => 'stu-9' }) as any;
  await resolveStudent(CFG, '4-2', 7);

  let body: any = null;
  (globalThis as any).fetch = async (_u: string, init: any) => {
    body = JSON.parse(init.body);
    return { ok: true, status: 200, text: async () => '1' } as any;
  };
  await pushSkillState({ appId: 'tsunagi', ...CFG }, [{ skill_id: 'a', attempts: 1, corrects: 1 }]);
  assert.equal(body.p_student_id, 'stu-9');
});

test('入れていなければ null で送る（従来どおり端末単位で記録される）', async () => {
  stubLS();
  let body: any = null;
  (globalThis as any).fetch = async (_u: string, init: any) => {
    body = JSON.parse(init.body);
    return { ok: true, status: 200, text: async () => '1' } as any;
  };
  await pushSkillState({ appId: 'tsunagi', ...CFG }, [{ skill_id: 'a', attempts: 1, corrects: 1 }]);
  assert.equal(body.p_student_id, null);
  assert.ok(body.p_device_key, '端末IDは常に付く');
});

test('clearStudent で名乗りを取り消せる（端末を渡しまちがえたとき用）', async () => {
  stubLS();
  (globalThis as any).fetch = async () => ({ ok: true, json: async () => 'stu-1' }) as any;
  await resolveStudent(CFG, '4-2', 3);
  assert.ok(getStudent());
  clearStudent();
  assert.equal(getStudent(), null);
});

test('壊れた保存データは無視する（古い形式が残っていても落ちない）', () => {
  const map = stubLS();
  map.set('lak_student_v1', '{"studentId":123}');
  assert.equal(getStudent(), null);
  map.set('lak_student_v1', 'not json');
  assert.equal(getStudent(), null);
});

/* ---------- 名乗りが後から決まったときの送り直し ---------- */

/**
 * ハブから来た子は「起動 → 記録を送る → 名乗りが解決する」の順に進む。
 * 送り直しが無いと、その1回は誰のものか付かないまま届き、
 * その子が次に1問解かずに閉じれば先生の画面には永久に出ない。
 */
test('createSyncedStorage: 名乗りが決まったら、すでに送った分を送り直す', async () => {
  stubLS();
  const calls: any[] = [];
  (globalThis as any).fetch = async (url: string, init: any) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body });
    if (url.endsWith('/resolve_student')) return { ok: true, json: async () => 'stu-late' } as any;
    return { ok: true, status: 200, text: async () => '1' } as any;
  };

  const s = createSyncedStorage({
    appId: 'late-sync', supabaseUrl: CFG.supabaseUrl, supabaseKey: CFG.supabaseKey, debounceMs: 5,
  });
  s.setItem('k', JSON.stringify({ state: { mastery: { a: { attempts: 3, corrects: 2 } } } }));
  await new Promise((r) => setTimeout(r, 30));

  const mine = () => calls.filter((c) => c.body.p_app_id === 'late-sync');
  assert.equal(mine().length, 1, 'まず1回、名乗り無しで届く');
  assert.equal(mine()[0].body.p_student_id, null);

  await resolveStudent(CFG, '4-2', 12);
  await new Promise((r) => setTimeout(r, 30));

  assert.equal(mine().length, 2, '名乗りが決まったら送り直す');
  assert.equal(mine()[1].body.p_student_id, 'stu-late');
  assert.deepEqual(
    mine()[1].body.p_rows, mine()[0].body.p_rows,
    '送り直しは全量。差分ではないので、1回で端末の中身がそのまま反映される',
  );
});

test('createPusher: 名乗りが決まったら、直近の内容を送り直す', async () => {
  stubLS();
  const calls: any[] = [];
  (globalThis as any).fetch = async (url: string, init: any) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body });
    if (url.endsWith('/resolve_student')) return { ok: true, json: async () => 'stu-kokugo' } as any;
    return { ok: true, status: 200, text: async () => '1' } as any;
  };

  const push = createPusher({ appId: 'late-push', ...CFG }, 5);
  push([{ skill_id: 'q-1', attempts: 2, corrects: 1 }]);
  await new Promise((r) => setTimeout(r, 30));

  const mine = () => calls.filter((c) => c.body.p_app_id === 'late-push');
  assert.equal(mine().length, 1);
  assert.equal(mine()[0].body.p_student_id, null);

  await resolveStudent(CFG, '4-2', 12);
  await new Promise((r) => setTimeout(r, 30));

  assert.equal(mine().length, 2, '名乗りが決まったら送り直す');
  assert.equal(mine()[1].body.p_student_id, 'stu-kokugo');
});

test('名乗る前は購読していても何も起きない（送るものが無いのに送らない）', async () => {
  stubLS();
  const calls: any[] = [];
  (globalThis as any).fetch = async (url: string, init: any) => {
    calls.push({ url, body: JSON.parse(init.body) });
    if (url.endsWith('/resolve_student')) return { ok: true, json: async () => 'stu-x' } as any;
    return { ok: true, status: 200, text: async () => '1' } as any;
  };
  createPusher({ appId: 'never-pushed', ...CFG }, 5);   // 1問も解いていないアプリ
  await resolveStudent(CFG, '4-2', 12);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(calls.filter((c) => c.body.p_app_id === 'never-pushed').length, 0);
});

/* ---------- 名乗るか、名乗らずに使うか ---------- */

test('決めるまでは null。コードなしを選ぶと二度と聞かない', () => {
  stubLS();
  assert.equal(getJoinChoice(), null, 'まだ決めていない');
  chooseAnonymous();
  assert.equal(getJoinChoice(), 'anonymous', '断った子に毎回は出さない');
});

test('名乗れたら choice は named になる', async () => {
  stubLS();
  (globalThis as any).fetch = async (url: string) =>
    url.endsWith('/resolve_student')
      ? ({ ok: true, json: async () => 'stu-1' } as any)
      : ({ ok: true, json: async () => ({ events: 0, tests: 0, skills: 0 }) } as any);
  await resolveStudent(CFG, '2643', 12);
  assert.equal(getJoinChoice(), 'named');
});

test('名乗りを消すと、また聞かれる状態に戻る', async () => {
  stubLS();
  (globalThis as any).fetch = async () => ({ ok: true, json: async () => 'stu-1' } as any);
  await resolveStudent(CFG, '2643', 12);
  clearStudent();
  assert.equal(getJoinChoice(), null, '消したのに「決めた」が残っていると、二度と入力できない');
});

test('claimDevice: 端末と児童IDを送り、拾えた件数を返す', async () => {
  stubLS();
  let sent: any = null;
  (globalThis as any).fetch = async (url: string, init: any) => {
    sent = { url, body: JSON.parse(init.body) };
    return { ok: true, json: async () => ({ events: 7846, tests: 31, skills: 741 }) } as any;
  };
  const r = await claimDevice(CFG, 'stu-9');
  assert.equal(r.ok, true);
  assert.deepEqual([r.events, r.tests, r.skills], [7846, 31, 741]);
  assert.ok(sent.url.endsWith('/rpc/claim_device'));
  assert.equal(sent.body.p_student_id, 'stu-9');
  assert.ok(typeof sent.body.p_device_key === 'string' && sent.body.p_device_key.length > 0);
});

test('claimDevice: 失敗しても学習を止めない（例外を投げず0件で返す）', async () => {
  stubLS();
  (globalThis as any).fetch = async () => { throw new Error('offline'); };
  const r = await claimDevice(CFG, 'stu-9');
  assert.deepEqual(r, { ok: false, events: 0, tests: 0, skills: 0 });
});

test('名乗っていなければ、claimDevice は何も送らない', async () => {
  stubLS();
  let called = false;
  (globalThis as any).fetch = async () => { called = true; return { ok: true } as any; };
  const r = await claimDevice(CFG);
  assert.equal(r.ok, false);
  assert.equal(called, false);
});
