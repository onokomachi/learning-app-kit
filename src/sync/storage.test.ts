import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSyncable, toRows, createSyncedStorage, localAdapter } from './storage.js';
import { lookupSkill, skillLabel, listApps } from '../catalog/index.js';

/* ---------- localStorage の最小スタブ（Node には無いので用意する） ---------- */
function installLocalStorage() {
  const map = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
  return map;
}

test('parseSyncable: persist の形から state を取り出す / 壊れていたら null', () => {
  assert.deepEqual(parseSyncable('{"state":{"mastery":{}},"version":2}'), { mastery: {} });
  assert.equal(parseSyncable('こわれたJSON'), null);
  assert.equal(parseSyncable(null), null);
});

test('toRows: mastery と review を1行にまとめる（device_key/app_id は行に入れない）', () => {
  const rows = toRows({
    mastery: { 'rel-perp': { attempts: 6, corrects: 5, perfectStreak: 2 } },
    review: { 'rel-perp': { box: 2, lastTs: 100, nextDueTs: 200 } },
  });
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    skill_id: 'rel-perp', attempts: 6, corrects: 5, perfect_streak: 2,
    box: 2, next_due_ts: 200, last_ts: 100,
  });
});

test('toRows: review が無いスキルでも欠落させず null で送る', () => {
  const rows = toRows({ mastery: { 'rel-para': { attempts: 1, corrects: 0 } } });
  assert.equal(rows[0]!.box, null);
  assert.equal(rows[0]!.perfect_streak, 0);
});

test('設定が無ければ localAdapter と同じ＝今までどおり端末内だけで動く', () => {
  installLocalStorage();
  const s = createSyncedStorage({ appId: 'suihei' });
  assert.equal(s.getItem, localAdapter.getItem);
  s.setItem('k', 'v');
  assert.equal(s.getItem('k'), 'v');
});

test('同期ありでも、読み書きは localStorage に対して即座に効く（オフラインファースト）', async () => {
  const map = installLocalStorage();
  const calls: any[] = [];
  (globalThis as any).fetch = async (url: string, init: any) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return { ok: true, status: 200, text: async () => '1' } as any;
  };
  let synced: any = null;
  const s = createSyncedStorage({
    appId: 'suihei', supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k',
    debounceMs: 5, onSync: (r) => { synced = r; },
  });
  const payload = JSON.stringify({ state: { mastery: { 'rel-perp': { attempts: 2, corrects: 2 } } }, version: 2 });
  s.setItem('suihei_progress_v1', payload);

  // 送信を待たずに、その場で端末から読めている
  assert.equal(map.get('suihei_progress_v1'), payload);
  assert.equal(calls.length, 0, 'デバウンス中はまだ送らない');

  await new Promise((r) => setTimeout(r, 30));
  assert.equal(calls.length, 1, 'デバウンス後に1回だけ送る');
  assert.match(calls[0].url, /\/rest\/v1\/rpc\/sync_skill_state$/, 'テーブルではなくRPCへ送る');
  assert.equal(calls[0].body.p_app_id, 'suihei');
  assert.ok(calls[0].body.p_device_key, '端末IDが付く');
  assert.equal(calls[0].body.p_rows[0].skill_id, 'rel-perp');
  assert.deepEqual(synced, { ok: true, pushed: 1 });
});

test('サーバが受理した件数を報告する（巻き戻しで弾かれた行は含まれない）', async () => {
  installLocalStorage();
  (globalThis as any).fetch = async () => ({ ok: true, status: 200, text: async () => '0' }) as any;
  let synced: any = null;
  const s = createSyncedStorage({
    appId: 'suihei', supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k',
    debounceMs: 5, onSync: (r) => { synced = r; },
  });
  s.setItem('k', JSON.stringify({ state: { mastery: { a: { attempts: 1, corrects: 1 } } } }));
  await new Promise((r) => setTimeout(r, 30));
  assert.deepEqual(synced, { ok: true, pushed: 0 }, '2件送っても受理0なら pushed は 0');
});

test('ネットが落ちていても setItem は投げない（学習を止めない）', async () => {
  installLocalStorage();
  (globalThis as any).fetch = async () => { throw new Error('offline'); };
  let synced: any = null;
  const s = createSyncedStorage({
    appId: 'suihei', supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k',
    debounceMs: 5, onSync: (r) => { synced = r; },
  });
  s.setItem('k', JSON.stringify({ state: { mastery: { a: { attempts: 1, corrects: 1 } } } }));
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(synced.ok, false);
  assert.equal(synced.error, 'offline');
});

/* ---------- カタログ ---------- */
test('lookupSkill: 記号を人が読めるものに戻す', () => {
  const r = lookupSkill('suihei', 'rel-perp');
  assert.ok(r, 'rel-perp が引ける');
  assert.equal(r!.app_title, '垂直・平行と四角形');
  assert.equal(r!.module_title, 'すいちょく・平行はっけん');
  assert.match(r!.label, /垂直をみつける/);
});

test('lookupSkill: 未知の記号は null（黙って捨てない）', () => {
  assert.equal(lookupSkill('suihei', 'nope'), null);
  assert.equal(lookupSkill('unknown-app', 'rel-perp'), null);
});

test('skillLabel: カタログに無くても画面が空にならない', () => {
  assert.equal(skillLabel('suihei', 'nope'), 'nope');
});

test('誤概念が skillId に結びついている', () => {
  const r = lookupSkill('suihei', 'eh-diag');
  assert.ok(r!.misconceptions.length >= 3, 'eh-diag に誤概念が3件以上ぶら下がる');
  assert.ok(r!.misconceptions.some((m) => m.label.includes('長方形の対角線も垂直')));
});

test('listApps: 9単元すべてが登録され、学年順にならぶ', () => {
  const apps = listApps();
  assert.equal(apps.length, 9);
  const grades = apps.map((a) => a.grade);
  assert.deepEqual(grades, [...grades].sort((x, y) => x - y), '学年の昇順');
  assert.ok(apps.every((a) => a.skill_count > 0), '全単元にスキルがある');
  assert.ok(apps.every((a) => a.modules.length > 0), '全単元にモジュールがある');
});

test('skill_count が modules の実数と一致する（生成のとりこぼし検出）', () => {
  for (const a of listApps()) {
    const actual = a.modules.reduce((s, m) => s + m.skills.length, 0);
    assert.equal(actual, a.skill_count, `${a.app_id} の件数が食いちがう`);
  }
});

test('app_id と skill_id が全単元で一意（衝突すると別単元の記録が混ざる）', () => {
  const seen = new Set<string>();
  for (const a of listApps()) for (const m of a.modules) for (const s of m.skills) {
    const key = `${a.app_id}/${s.skill_id}`;
    assert.ok(!seen.has(key), `重複: ${key}`);
    seen.add(key);
  }
});

test('他単元の記号を引いても null（単元をまたいで混ざらない）', () => {
  assert.equal(lookupSkill('gaisu', 'rel-perp'), null);
  assert.ok(lookupSkill('suihei', 'rel-perp'));
});

test('接頭辞つきで記録される単元も正しく引ける（syousu の addsub-）', () => {
  const r = lookupSkill('syousu', 'addsub-add-basic');
  assert.ok(r, 'addsub-add-basic が引ける');
  assert.equal(r!.module_id, 'decimal-addsub');
});
