import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTrial, hashHasTrial, _resetTrialForTest } from './trialMode.js';
import { getStudent } from './student.js';
import { flushEvents, getSentMark } from './events.js';
import { pushSkillState } from './push.js';
import { trialAllows, _setPortalConfigForTest, buildTrialUrl, loadPortalConfig, getPortalConfig } from './portalConfig.js';
import { trialFamilyOf, mathTrialKey, TRIAL_FEATURE_SETS } from './trialFeatures.js';

function stubStorage() {
  const mk = () => {
    const map = new Map<string, string>();
    return { map, api: { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), removeItem: (k: string) => void map.delete(k) } };
  };
  const ls = mk(); const ss = mk();
  (globalThis as any).localStorage = ls.api;
  (globalThis as any).sessionStorage = ss.api;
  return { ls: ls.map, ss: ss.map };
}

function stubLocation(hash: string) {
  const loc = { hash, pathname: '/', search: '', origin: 'https://app.example' };
  (globalThis as any).location = loc;
  (globalThis as any).history = { replaceState: (_a: unknown, _b: string, url: string) => { loc.hash = url.includes('#') ? url.slice(url.indexOf('#')) : ''; } };
  return loc;
}

function clearEnv() {
  delete (globalThis as any).location;
  delete (globalThis as any).history;
  _resetTrialForTest();
  _setPortalConfigForTest(null);
}

test('hashHasTrial: #trial・#trial=1・ほかと並んだ trial を受け取る', () => {
  assert.equal(hashHasTrial('#trial'), true);
  assert.equal(hashHasTrial('#trial=1'), true);
  assert.equal(hashHasTrial('#c=4-2&trial'), true);
  assert.equal(hashHasTrial('#c=4-2&n=12'), false);
  assert.equal(hashHasTrial(''), false);
  assert.equal(hashHasTrial('#trials'), false);
});

test('#trial で開くと体験中になり、URL から消え、同じタブでは覚えている', () => {
  const { ss } = stubStorage();
  const loc = stubLocation('#trial');
  _resetTrialForTest();
  assert.equal(isTrial(), true);
  assert.equal(loc.hash, '', '#trial は URL から消す');
  assert.equal(ss.get('lak_trial_v1'), '1');
  _resetTrialForTest();
  assert.equal(isTrial(), true, '読みなおしても（同じタブなら）体験中のまま');
  clearEnv();
});

test('ブラウザ以外・#trial なしでは体験中にならない', () => {
  stubStorage();
  clearEnv();
  assert.equal(isTrial(), false);
  stubLocation('#c=4-2&n=12');
  _resetTrialForTest();
  assert.equal(isTrial(), false);
  clearEnv();
});

test('体験中は、名乗った端末でも名乗っていない扱い（学級の記録にさわらない）', () => {
  const { ls } = stubStorage();
  ls.set('lak_student_v1', JSON.stringify({ studentId: 's1', joinCode: '4-2', number: 12 }));
  clearEnv();
  assert.equal(getStudent()?.studentId, 's1');
  stubLocation('#trial');
  _resetTrialForTest();
  assert.equal(getStudent(), null);
  clearEnv();
});

test('体験中は答えを送らず、送ったことにして進める（あとで名乗っても体験の分は送られない）', async () => {
  stubStorage();
  stubLocation('#trial');
  _resetTrialForTest();
  let calls = 0;
  (globalThis as any).fetch = async () => { calls++; return { ok: true, text: async () => '1' } as any; };
  const cfg = { appId: 'trial-test', supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k' };
  const r = await flushEvents(cfg, [{ id: 'a', ts: 5000, skillId: 's', moduleId: 'm', correct: true }]);
  assert.equal(r.pushed, 0);
  assert.equal(calls, 0, 'サーバに送らない');
  assert.equal(getSentMark('trial-test'), 5000, '送ったことにして進める');
  const p = await pushSkillState(cfg, [{ skill_id: 's', attempts: 1, corrects: 1 } as any]);
  assert.equal(p.pushed, 0);
  assert.equal(calls, 0);
  clearEnv();
});

test('trialAllows: 体験中でなければ いつも使える。体験中は false の項目だけ閉じる。設定が無ければ使える', () => {
  stubStorage();
  clearEnv();
  _setPortalConfigForTest({ requireJoin: false, appId: 'gaisu', trialListed: true, trialFeatures: { boss: false } });
  assert.equal(trialAllows('boss'), true, '体験中でない');
  stubLocation('#trial');
  _resetTrialForTest();
  assert.equal(trialAllows('boss'), false);
  assert.equal(trialAllows('practice'), true, 'キーが無い＝使える');
  assert.equal(trialAllows(null), true);
  _setPortalConfigForTest(null);
  assert.equal(trialAllows('boss'), true, 'まだ読めていない＝止めない');
  clearEnv();
});

test('loadPortalConfig: サーバの値を読み、端末に覚える。読めなければ前の値のまま', async () => {
  const { ls } = stubStorage();
  stubLocation('');
  _resetTrialForTest();
  _setPortalConfigForTest(null);
  let body: any = null;
  (globalThis as any).fetch = async (_u: string, init: any) => {
    body = JSON.parse(init.body);
    return { ok: true, json: async () => ({ require_join: true, app_id: 'gaisu', trial_listed: false, trial_features: { test: false } }) } as any;
  };
  const c = await loadPortalConfig({ supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k' });
  assert.deepEqual(body, { p_origin: 'https://app.example' });
  assert.deepEqual(c, { requireJoin: true, appId: 'gaisu', trialListed: false, trialFeatures: { test: false } });
  assert.ok(ls.get('lak_portal_cfg_v1'));
  (globalThis as any).fetch = async () => { throw new Error('offline'); };
  const d = await loadPortalConfig({ supabaseUrl: 'https://x.supabase.co', supabaseKey: 'k' });
  assert.equal(d, null);
  assert.equal(getPortalConfig()?.requireJoin, true, '通信が切れても前の値');
  clearEnv();
});

test('体験のリンク・種類・算数の画面のキー', () => {
  assert.equal(buildTrialUrl('https://syo4-gaisu.vercel.app/'), 'https://syo4-gaisu.vercel.app/#trial');
  assert.equal(buildTrialUrl('https://a.vercel.app/#c=1&n=2'), 'https://a.vercel.app/#trial');
  assert.equal(trialFamilyOf('gongitsune'), 'kokugo');
  assert.equal(trialFamilyOf('eigo4'), 'eigo');
  assert.equal(trialFamilyOf('sanmon'), 'sanmon');
  assert.equal(trialFamilyOf('tsunagi'), 'whole');
  assert.equal(trialFamilyOf('gaisu'), 'math');
  assert.equal(mathTrialKey('BOSS'), 'boss');
  assert.equal(mathTrialKey('REFLECT'), 'test');
  assert.equal(mathTrialKey('HUB'), null);
  assert.ok(!TRIAL_FEATURE_SETS.sanmon.some((f) => f.key === 'class_duel'), 'クラス対戦は体験では いつも閉じるので一覧に出さない');
});
