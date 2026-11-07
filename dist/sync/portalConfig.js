import { isTrial } from './trialMode.js';
import { SOL_URL } from './access.js';
/** SOL の体験の入口 */
export const SOL_TRIAL_URL = `${SOL_URL}/#trial`;
const CACHE_KEY = 'lak_portal_cfg_v1';
let current = null;
let loadedOnce = false;
const listeners = new Set();
function readCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? normalize(JSON.parse(raw)) : null;
    }
    catch {
        return null;
    }
}
function normalize(v) {
    if (!v || typeof v !== 'object')
        return null;
    const o = v;
    const feats = {};
    const raw = (o.trialFeatures ?? o.trial_features);
    if (raw && typeof raw === 'object')
        for (const [k, b] of Object.entries(raw))
            if (typeof b === 'boolean')
                feats[k] = b;
    return {
        requireJoin: (o.requireJoin ?? o.require_join) === true,
        appId: typeof (o.appId ?? o.app_id) === 'string' ? String(o.appId ?? o.app_id) : null,
        trialListed: (o.trialListed ?? o.trial_listed) !== false,
        trialFeatures: feats,
    };
}
/** いまわかっている設定（まだ読んでいなければ、前に覚えた値。それも無ければ null） */
export function getPortalConfig() {
    if (!current && !loadedOnce)
        current = readCache();
    return current;
}
export function subscribePortalConfig(cb) {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
}
function origin() {
    const g = globalThis;
    return typeof g.location?.origin === 'string' ? g.location.origin : null;
}
let inflight = null;
/** サーバから読みなおす。読めなければ前の値のまま（null を返す） */
export function loadPortalConfig(config) {
    const { supabaseUrl, supabaseKey } = config;
    const o = origin();
    if (!supabaseUrl || !supabaseKey || !o)
        return Promise.resolve(null);
    if (inflight)
        return inflight;
    inflight = (async () => {
        try {
            const res = await fetch(`${supabaseUrl}/rest/v1/rpc/portal_app_config`, {
                method: 'POST',
                headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ p_origin: o }),
            });
            if (!res.ok)
                return null;
            const c = normalize(await res.json());
            if (!c)
                return null;
            current = c;
            loadedOnce = true;
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(c));
            }
            catch { /* 覚えられなくても動く */ }
            for (const cb of [...listeners]) {
                try {
                    cb(c);
                }
                catch { /* noop */ }
            }
            return c;
        }
        catch {
            return null;
        }
        finally {
            inflight = null;
        }
    })();
    return inflight;
}
/**
 * 体験中に、その項目を使えるか。体験中でなければ いつも true。
 * 設定がまだ読めていない・項目の設定が無い ときは使える（はじめの設定は「全部使える」）。
 */
export function trialAllows(key, cfg = getPortalConfig()) {
    if (!key || !isTrial())
        return true;
    return cfg?.trialFeatures[key] !== false;
}
/** 体験を1回数える（タブごとに1回だけ。答えの中身は送らない） */
export async function trialHit(config) {
    const { supabaseUrl, supabaseKey } = config;
    const o = origin();
    if (!supabaseUrl || !supabaseKey || !o || !isTrial())
        return;
    const mark = 'lak_trial_hit_v1';
    try {
        if (sessionStorage.getItem(mark) === '1')
            return;
        sessionStorage.setItem(mark, '1');
    }
    catch { /* 覚えられなくても1回送る */ }
    try {
        await fetch(`${supabaseUrl}/rest/v1/rpc/trial_hit`, {
            method: 'POST',
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_origin: o }),
        });
    }
    catch { /* 数えられなくても体験は止めない */ }
}
/** SOL の体験の入口に並べるアプリ（体験に出す設定のものだけ） */
export async function fetchTrialApps(config) {
    const { supabaseUrl, supabaseKey } = config;
    if (!supabaseUrl || !supabaseKey)
        return null;
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/trial_apps`, {
            method: 'POST',
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: '{}',
        });
        if (!res.ok)
            return null;
        const rows = (await res.json());
        return rows.map((r) => ({ appId: r.app_id, title: r.title, subject: r.subject, grade: r.grade, url: r.url }));
    }
    catch {
        return null;
    }
}
/** 体験の入口から開くリンク（アプリのアドレスの最後に #trial） */
export function buildTrialUrl(appUrl) {
    return `${appUrl.replace(/[#?].*$/, '').replace(/\/$/, '')}/#trial`;
}
/** テスト用 */
export function _setPortalConfigForTest(c) { current = c; loadedOnce = c !== null; }
//# sourceMappingURL=portalConfig.js.map