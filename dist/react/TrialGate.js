import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * 体験版の画面部品（2026-11-07）。
 *
 * - TrialBanner：体験中のタブに、画面のすみに小さく「たいけんばん」と「おわる」を出す（JoinGate が出す）
 * - TrialNotListed：PRISM で「体験に出さない」にしたアプリを体験で開いたときの画面（JoinGate が出す）
 * - TrialLock / useTrialLocked：体験で閉じた項目の画面の代わりに出す（各アプリが画面の切りかえのところで使う）
 *
 * 見た目は JoinGate と同じく、インラインスタイルで自己完結させる（アプリごとのテーマに沈まないように）。
 */
import { useEffect, useState } from 'react';
import { getPortalConfig, subscribePortalConfig, trialAllows, isTrial, endTrial, SOL_TRIAL_URL, } from '../sync/index.js';
const FONT = 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
/** いまの設定（読めたら更新される） */
export function usePortalConfig() {
    const [cfg, setCfg] = useState(() => getPortalConfig());
    useEffect(() => subscribePortalConfig(setCfg), []);
    return cfg;
}
/** 体験中で、その項目が閉じていれば そのキー。使えるなら null（体験中でなければ いつも null） */
export function useTrialLocked(key) {
    const cfg = usePortalConfig();
    if (!key)
        return null;
    return trialAllows(key, cfg) ? null : key;
}
/** 体験中に、項目ごとに使えるかを調べる関数を返す（画面の中で何度も調べるとき） */
export function useTrialAllows() {
    const cfg = usePortalConfig();
    return (key) => trialAllows(key, cfg);
}
function Card({ children }) {
    return (_jsx("div", { style: {
            width: '100%', maxWidth: 380, background: '#fff', borderRadius: 22, padding: 24, textAlign: 'center', boxSizing: 'border-box',
            fontFamily: FONT, color: '#0f2540', boxShadow: '0 24px 60px -20px rgba(8,12,20,0.5)',
        }, children: children }));
}
const btn = {
    display: 'block', width: '100%', borderRadius: 14, padding: '12px 14px', background: '#1d4ed8', color: '#fff', border: 0,
    fontWeight: 900, fontSize: 15, textDecoration: 'none', cursor: 'pointer', boxSizing: 'border-box',
};
/** 体験で閉じた項目の画面の代わり。onBack で前の画面（メニュー）にもどる */
export function TrialLock({ onBack, label }) {
    return (_jsx("div", { role: "dialog", "aria-label": "\u305F\u3044\u3051\u3093\u3070\u3093\u3067\u306F \u3064\u304B\u3048\u306A\u3044", style: {
            width: '100%', height: '100%', minHeight: 320, display: 'grid', placeItems: 'center', padding: 16, boxSizing: 'border-box',
            background: 'rgba(8,12,20,0.55)',
        }, children: _jsxs(Card, { children: [_jsx("div", { style: { fontSize: 40, lineHeight: 1 }, children: "\uD83D\uDD12" }), _jsxs("p", { style: { margin: '12px 0 6px', fontSize: 19, fontWeight: 900 }, children: [label ? `「${label}」は ` : '', "\u305F\u3044\u3051\u3093\u3070\u3093\u3067\u306F \u3064\u304B\u3048\u306A\u3044\u3088"] }), _jsx("p", { style: { margin: '0 0 18px', fontSize: 13, lineHeight: 1.7, color: '#54637a' }, children: "\u307B\u304B\u306E \u3068\u3053\u308D\u3092 \u305F\u3081\u3057\u3066\u307F\u3066\u306D\u3002" }), _jsx("button", { type: "button", style: btn, onClick: onBack, children: "\u3082\u3069\u308B" })] }) }));
}
/** 体験中のタブのしるし。「おわる」で ふつうにもどる */
export function TrialBanner() {
    return (_jsxs("div", { style: {
            position: 'fixed', left: '50%', bottom: 10, transform: 'translateX(-50%)', zIndex: 9990,
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px 5px 12px', borderRadius: 999,
            background: 'rgba(255,251,235,0.96)', border: '1px solid #fcd34d', boxShadow: '0 4px 12px -6px rgba(8,12,20,0.35)',
            fontFamily: FONT, fontSize: 12, fontWeight: 800, color: '#92400e', pointerEvents: 'auto',
        }, children: [_jsx("span", { children: "\u305F\u3044\u3051\u3093\u3070\u3093\uFF08\u304D\u308D\u304F\u306F \u306E\u3053\u3089\u306A\u3044\u3088\uFF09" }), _jsx("button", { type: "button", onClick: endTrial, style: {
                    border: 0, borderRadius: 999, background: '#f59e0b', color: '#fff', fontWeight: 900, fontSize: 11, padding: '4px 10px', cursor: 'pointer',
                }, children: "\u304A\u308F\u308B" })] }));
}
/** PRISM で「体験に出さない」にしたアプリを、体験で開いたとき */
export function TrialNotListed() {
    return (_jsx("div", { role: "dialog", "aria-label": "\u3044\u307E\u306F \u305F\u3044\u3051\u3093\u3067\u304D\u306A\u3044 \u30A2\u30D7\u30EA", style: {
            position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(8,12,20,0.86)', backdropFilter: 'blur(4px)',
            display: 'grid', placeItems: 'center', padding: 16,
        }, children: _jsxs(Card, { children: [_jsx("div", { style: { fontSize: 40, lineHeight: 1 }, children: "\uD83D\uDD12" }), _jsx("p", { style: { margin: '12px 0 6px', fontSize: 19, fontWeight: 900 }, children: "\u3053\u306E \u30A2\u30D7\u30EA\u306F \u3044\u307E \u305F\u3044\u3051\u3093\u3067\u304D\u306A\u3044\u3088" }), _jsx("p", { style: { margin: '0 0 18px', fontSize: 13, lineHeight: 1.7, color: '#54637a' }, children: "\u305F\u3044\u3051\u3093\u306E \u3044\u308A\u3050\u3061\u304B\u3089\u3001\u307B\u304B\u306E \u30A2\u30D7\u30EA\u3092 \u3048\u3089\u3093\u3067\u306D\u3002" }), _jsx("a", { href: SOL_TRIAL_URL, style: btn, children: "\u305F\u3044\u3051\u3093\u306E \u3044\u308A\u3050\u3061\u3078" })] }) }));
}
export { isTrial };
//# sourceMappingURL=TrialGate.js.map