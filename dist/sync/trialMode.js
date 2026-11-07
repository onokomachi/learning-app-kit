/**
 * 体験版（2026-11-07 先生と決めた）。
 *
 * SOL の体験の入口（https://class-portal-kids.vercel.app/#trial）から開いたアプリは、URL の最後に #trial が付いてくる。
 * それを受け取ったタブは「体験中」になる：
 *   - 名乗っていない扱い（getStudent() が null）。名乗った端末でも、体験中は学級の記録・セーブにさわらない
 *   - 答えはサーバに送らない（回数だけ trial_hit で数える）
 *   - 使える画面は PRISM の「体験」設定（アプリごと・項目ごと）で決まる（portalConfig.ts の trialAllows）
 *
 * 覚えるのはタブの中だけ（sessionStorage）。タブを閉じる・「体験を おわる」で、ふつうにもどる。
 * #trial は受け取ったら URL から消す（ブックマーク・共有に残さない）。
 */
const FLAG = 'lak_trial_v1';
let memo = null;
function env() {
    const g = globalThis;
    const loc = g.location;
    if (!loc || typeof loc.hash !== 'string')
        return null;
    let session = null;
    try {
        session = g.sessionStorage ?? null;
    }
    catch {
        session = null;
    }
    return {
        hash: loc.hash,
        session,
        replaceHash: (next) => {
            try {
                g.history?.replaceState?.(null, '', `${loc.pathname ?? ''}${loc.search ?? ''}${next}`);
            }
            catch { /* 消せなくても動く */ }
        },
    };
}
/** URL のハッシュに trial が入っているか（#trial ／ #trial=1 ／ #c=..&trial） */
export function hashHasTrial(hash) {
    const p = hash.replace(/^#/, '');
    if (!p)
        return false;
    return p.split('&').some((kv) => kv === 'trial' || kv.startsWith('trial='));
}
/** このタブは体験中か。はじめて呼ばれたときに URL の #trial を受け取る */
export function isTrial() {
    if (memo !== null)
        return memo;
    const e = env();
    if (!e)
        return (memo = false);
    let on = false;
    try {
        on = e.session?.getItem(FLAG) === '1';
    }
    catch {
        on = false;
    }
    if (!on && hashHasTrial(e.hash)) {
        on = true;
        try {
            e.session?.setItem(FLAG, '1');
        }
        catch { /* 覚えられなくても、このページの間は体験 */ }
        const rest = e.hash.replace(/^#/, '').split('&').filter((kv) => kv && kv !== 'trial' && !kv.startsWith('trial='));
        e.replaceHash(rest.length ? `#${rest.join('&')}` : '');
    }
    return (memo = on);
}
/** 体験を おわる（このタブを ふつうにもどして、読みなおす） */
export function endTrial() {
    const e = env();
    try {
        e?.session?.removeItem(FLAG);
    }
    catch { /* noop */ }
    memo = false;
    const g = globalThis;
    try {
        g.location?.reload?.();
    }
    catch { /* noop */ }
}
/** テスト用：覚えている状態を消す */
export function _resetTrialForTest() { memo = null; }
//# sourceMappingURL=trialMode.js.map