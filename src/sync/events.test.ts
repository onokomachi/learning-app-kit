import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toEventRows, flushEvents, getSentMark, setSentMark, clearSentMark } from './events.js';
import type { LogLike } from './types.js';

function stubLS() {
  const map = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
  return map;
}
const CFG = { appId: 'ev-test', supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k' };

const log = (over: Partial<LogLike> = {}): LogLike => ({
  id: 'x1', ts: 1000, skillId: 'meaning-man', moduleId: 'meaning', correct: true, ...over,
});

test('toEventRows: まだ送っていない分だけを、古い順に返す', () => {
  const logs = [log({ id: 'c', ts: 3000 }), log({ id: 'b', ts: 2000 }), log({ id: 'a', ts: 1000 })];
  const rows = toEventRows(logs, 1500);
  assert.deepEqual(rows.map((r) => r.event_id), ['b', 'c'], '1500以前は送らない／古い順に並ぶ');
});

test('toEventRows: id が無い古いアプリでも、時刻とスキルから一意なIDを作る', () => {
  const rows = toEventRows([log({ id: undefined, ts: 1234, skillId: 'round-up' })], 0);
  assert.equal(rows[0]!.event_id, '1234-round-up');
});

test('toEventRows: 本番テストの答案は detail として一緒に運ぶ', () => {
  const detail = { mode: '表', omoteScore: 85, totalMax: 100, steps: [] };
  const rows = toEventRows([log({ detail })], 0);
  assert.deepEqual(rows[0]!.detail, detail);
});

test('toEventRows: 壊れた行は落とすが、他の行は落とさない', () => {
  const rows = toEventRows(
    [log({ id: 'ok', ts: 2000 }), { ts: 3000, skillId: '', moduleId: 'm', correct: true } as LogLike],
    0,
  );
  assert.deepEqual(rows.map((r) => r.event_id), ['ok']);
});

test('flushEvents: 成功したら「どこまで送ったか」を進める', async () => {
  stubLS();
  let sent: any = null;
  (globalThis as any).fetch = async (_u: string, init: any) => {
    sent = JSON.parse(init.body);
    return { ok: true, status: 200, text: async () => '2' } as any;
  };
  const r = await flushEvents(CFG, [log({ id: 'a', ts: 1000 }), log({ id: 'b', ts: 2000 })]);
  assert.deepEqual(r, { ok: true, pushed: 2 });
  assert.equal(sent.p_app_id, 'ev-test');
  assert.equal(sent.p_events.length, 2);
  assert.equal(getSentMark('ev-test'), 2000, '最後に送った出来事の時刻を覚える');

  // 2回目は送るものが無い
  sent = null;
  const r2 = await flushEvents(CFG, [log({ id: 'a', ts: 1000 }), log({ id: 'b', ts: 2000 })]);
  assert.deepEqual(r2, { ok: true, pushed: 0 });
  assert.equal(sent, null, '同じ分を二度は送らない');
});

test('flushEvents: 失敗したらマークを進めない（次の機会に送り直す）', async () => {
  stubLS();
  (globalThis as any).fetch = async () => { throw new Error('offline'); };
  const r = await flushEvents(CFG, [log({ id: 'a', ts: 5000 })]);
  assert.equal(r.ok, false);
  assert.equal(getSentMark('ev-test'), 0, '送れていないのに送ったことにしない');
});

test('clearSentMark: 印を消すと、全部が送り直しの対象に戻る', () => {
  stubLS();
  setSentMark('ev-test', 9999);
  assert.equal(getSentMark('ev-test'), 9999);
  clearSentMark('ev-test');
  assert.equal(getSentMark('ev-test'), 0);
});

test('設定が無ければ何もしない（設定し忘れても壊れない）', async () => {
  stubLS();
  let called = false;
  (globalThis as any).fetch = async () => { called = true; return { ok: true } as any; };
  const r = await flushEvents({ appId: 'ev-test' }, [log()]);
  assert.deepEqual(r, { ok: true, pushed: 0 });
  assert.equal(called, false);
});
