import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHandoffUrl, adoptStudentFromUrl } from './handoff.js';
import { getStudent } from './student.js';

function setup(hash: string) {
  const map = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
  const replaced: string[] = [];
  (globalThis as any).location = { hash, pathname: '/', search: '' };
  (globalThis as any).history = { replaceState: (_a: unknown, _b: string, c: string) => replaced.push(c) };
  return { map, replaced };
}
const CFG = { supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k' };

test('リンクは ハッシュに載せる（サーバのログに出席番号を残さない）', () => {
  const u = buildHandoffUrl('https://app.vercel.app/', '4-2', 12);
  assert.equal(u, 'https://app.vercel.app/#c=4-2&n=12');
  assert.ok(!u.includes('?'), 'クエリには載せない');
});

test('リンクに児童IDそのものは載せない（なりすませる文字列を配らない）', () => {
  const u = buildHandoffUrl('https://app.vercel.app', '4-2', 12);
  assert.ok(!/stu|uuid|[0-9a-f]{8}-[0-9a-f]{4}/.test(u));
});

test('URLの名乗りを受け取って覚え、URLから消す', async () => {
  const { replaced } = setup('#c=4-2&n=12');
  (globalThis as any).fetch = async () => ({ ok: true, json: async () => 'stu-1' }) as any;
  const s = await adoptStudentFromUrl(CFG);
  assert.deepEqual(s, { studentId: 'stu-1', joinCode: '4-2', number: 12 });
  assert.deepEqual(getStudent(), s, '端末が覚えている');
  assert.deepEqual(replaced, ['/'], 'ハッシュを消した');
});

test('同じ子が同じリンクで来たら、サーバに問い合わせない', async () => {
  setup('#c=4-2&n=12');
  (globalThis as any).fetch = async () => ({ ok: true, json: async () => 'stu-1' }) as any;
  await adoptStudentFromUrl(CFG);

  let called = false;
  (globalThis as any).location = { hash: '#c=4-2&n=12', pathname: '/', search: '' };
  (globalThis as any).fetch = async () => { called = true; return { ok: true, json: async () => 'x' } as any; };
  const s = await adoptStudentFromUrl(CFG);
  assert.equal(called, false);
  assert.equal(s!.studentId, 'stu-1');
});

test('別の番号で来たら、そちらに切り替える（端末の貸し借り）', async () => {
  setup('#c=4-2&n=12');
  (globalThis as any).fetch = async () => ({ ok: true, json: async () => 'stu-12' }) as any;
  await adoptStudentFromUrl(CFG);

  (globalThis as any).location = { hash: '#c=4-2&n=30', pathname: '/', search: '' };
  (globalThis as any).fetch = async () => ({ ok: true, json: async () => 'stu-30' }) as any;
  const s = await adoptStudentFromUrl(CFG);
  assert.equal(s!.number, 30);
  assert.equal(s!.studentId, 'stu-30');
});

test('URLに何も無ければ、今の名乗りをそのまま返す', async () => {
  setup('');
  let called = false;
  (globalThis as any).fetch = async () => { called = true; return { ok: true } as any; };
  assert.equal(await adoptStudentFromUrl(CFG), null);
  assert.equal(called, false);
});

test('サーバが拒否したら、今の名乗りを壊さない', async () => {
  setup('#c=4-2&n=12');
  (globalThis as any).fetch = async () => ({ ok: true, json: async () => 'stu-1' }) as any;
  await adoptStudentFromUrl(CFG);

  (globalThis as any).location = { hash: '#c=nope&n=99', pathname: '/', search: '' };
  (globalThis as any).fetch = async () =>
    ({ ok: false, json: async () => ({ message: 'この学級コードは登録されていません' }) }) as any;
  const s = await adoptStudentFromUrl(CFG);
  assert.equal(s!.studentId, 'stu-1', '前の名乗りが残る');
  assert.equal(getStudent()!.studentId, 'stu-1');
});

test('ブラウザ以外（locationが無い）では何もしない', async () => {
  const map = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
  delete (globalThis as any).location;
  delete (globalThis as any).history;
  let called = false;
  (globalThis as any).fetch = async () => { called = true; return { ok: true } as any; };
  assert.equal(await adoptStudentFromUrl(CFG), null);
  assert.equal(called, false);
});
