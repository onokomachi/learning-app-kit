import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchClosedApps, checkAppOpen } from './access.js';

const config = { supabaseUrl: 'https://x.supabase.co', supabaseKey: 'pk' };

function mockFetch(handler: (url: string, body: unknown) => { status: number; json?: unknown } | 'throw') {
  const calls: { url: string; body: unknown }[] = [];
  globalThis.fetch = (async (url: string, init?: { body?: string }) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    calls.push({ url, body });
    const r = handler(url, body);
    if (r === 'throw') throw new Error('offline');
    return { ok: r.status < 400, status: r.status, json: async () => r.json } as Response;
  }) as typeof fetch;
  return calls;
}

test('閉じた単元の一覧を読む', async () => {
  const calls = mockFetch(() => ({ status: 200, json: ['gaisu', 'bai'] }));
  const s = await fetchClosedApps(config, 'stu-1');
  assert.deepEqual([...s!].sort(), ['bai', 'gaisu']);
  assert.ok(calls[0]!.url.endsWith('/rpc/my_closed_apps'));
  assert.deepEqual(calls[0]!.body, { p_student_id: 'stu-1' });
});

test('読めないときは null（開いている扱い）', async () => {
  mockFetch(() => 'throw');
  assert.equal(await fetchClosedApps(config, 'stu-1'), null);
});

test('このアプリが閉じていれば false、分からなければ true（学習を止めない）', async () => {
  const calls = mockFetch(() => ({ status: 200, json: false }));
  assert.equal(await checkAppOpen(config, 'stu-1', 'https://syo4-gaisu.vercel.app'), false);
  assert.deepEqual(calls[0]!.body, { p_student_id: 'stu-1', p_origin: 'https://syo4-gaisu.vercel.app' });
  mockFetch(() => ({ status: 200, json: true }));
  assert.equal(await checkAppOpen(config, 'stu-1', 'https://a'), true);
  mockFetch(() => ({ status: 500 }));
  assert.equal(await checkAppOpen(config, 'stu-1', 'https://a'), true);
  mockFetch(() => 'throw');
  assert.equal(await checkAppOpen(config, 'stu-1', 'https://a'), true);
  assert.equal(await checkAppOpen({}, 'stu-1', 'https://a'), true);
});
