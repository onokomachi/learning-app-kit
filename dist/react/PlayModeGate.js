import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * 「ひとりで解いているか、2人で1台を使っているか」を聞く画面と、
 * 画面の隅の小さな切り替えボタン。仕組みは sync/playMode.ts。
 *
 * JoinGate の中から出すので、単元アプリ側は何も足さなくてよい。
 * 出るのは「学級コードあり・平日の授業の時間」だけ。それ以外は何も描かない。
 *
 * 見た目はどのアプリのテーマの上でも読めるように、インラインスタイルで自己完結させる。
 */
import { useEffect, useState } from 'react';
import { currentPlayMode, needsPlayModeAsk, setPlayMode, subscribePlayMode, isSchoolTime, getStudent, subscribeStudent, } from '../sync/index.js';
const FONT = 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
const S = {
    scrim: {
        position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(4,7,14,0.72)',
        backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 16,
    },
    card: {
        width: '100%', maxWidth: 400, boxSizing: 'border-box', borderRadius: 22, padding: 22,
        background: 'linear-gradient(160deg,#0d1422,#070b14)', color: '#e6efff', fontFamily: FONT,
        border: '1px solid rgba(34,211,238,0.35)',
        boxShadow: '0 0 0 1px rgba(34,211,238,0.12), 0 24px 60px -18px rgba(34,211,238,0.35)',
    },
    eyebrow: { margin: 0, fontSize: 11, letterSpacing: '0.28em', color: '#67e8f9', fontWeight: 800 },
    h: { margin: '6px 0 16px', fontSize: 20, fontWeight: 900 },
    choice: (accent) => ({
        width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
        padding: '14px 16px', marginBottom: 10, borderRadius: 16, cursor: 'pointer',
        background: 'rgba(255,255,255,0.03)', color: '#e6efff', fontFamily: FONT,
        border: `1px solid ${accent}`, boxShadow: `inset 0 0 22px -12px ${accent}`,
    }),
    tag: (accent) => ({
        minWidth: 58, fontSize: 15, fontWeight: 900, letterSpacing: '0.18em', color: accent,
    }),
    sub: { fontSize: 14, fontWeight: 800 },
    note: { margin: '8px 0 0', fontSize: 11, lineHeight: 1.7, color: '#8ea3c2' },
    pill: (duo) => ({
        position: 'fixed', right: 12, bottom: 12, zIndex: 9980, fontFamily: FONT,
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px',
        borderRadius: 999, cursor: 'pointer', fontSize: 11, fontWeight: 900, letterSpacing: '0.16em',
        background: 'rgba(7,11,20,0.82)', backdropFilter: 'blur(4px)',
        color: duo ? '#f0abfc' : '#67e8f9',
        border: `1px solid ${duo ? 'rgba(240,171,252,0.55)' : 'rgba(103,232,249,0.5)'}`,
    }),
};
const SOLO = '#67e8f9';
const DUO = '#f0abfc';
export function PlayModeGate({ enabled = true }) {
    const [now, setNow] = useState(() => Date.now());
    const [, setTick] = useState(0);
    useEffect(() => {
        if (!enabled)
            return;
        // 45分たったか・授業の時間に入ったかを見張る（30秒ごと）
        const id = setInterval(() => setNow(Date.now()), 30_000);
        const offMode = subscribePlayMode(() => { setNow(Date.now()); setTick((t) => t + 1); });
        const offStudent = subscribeStudent(() => setTick((t) => t + 1));
        return () => { clearInterval(id); offMode(); offStudent(); };
    }, [enabled]);
    if (!enabled || getStudent() === null || !isSchoolTime(new Date(now)))
        return null;
    const mode = currentPlayMode(now);
    const choose = (m) => { setPlayMode(m); setNow(Date.now()); };
    if (needsPlayModeAsk(now)) {
        return (_jsx("div", { style: S.scrim, role: "dialog", "aria-label": "\u3072\u3068\u308A\u304B \u3075\u305F\u308A\u304B", children: _jsxs("div", { style: S.card, children: [_jsx("p", { style: S.eyebrow, children: "MODE SELECT" }), _jsx("h2", { style: S.h, children: "\u3044\u307E\u3001\u3069\u3046\u3084\u3063\u3066 \u3068\u304F\uFF1F" }), _jsxs("button", { type: "button", onClick: () => choose('solo'), style: S.choice(SOLO), children: [_jsx("span", { style: S.tag(SOLO), children: "SOLO" }), _jsx("span", { style: S.sub, children: "\u3072\u3068\u308A\u3067 \u3068\u304F" })] }), _jsxs("button", { type: "button", onClick: () => choose('duo'), style: S.choice(DUO), children: [_jsx("span", { style: S.tag(DUO), children: "DUO" }), _jsx("span", { style: S.sub, children: "\u3075\u305F\u308A\u3067 1\u53F0\u3092 \u3064\u304B\u3046" })] }), _jsx("p", { style: S.note, children: "\u3075\u305F\u308A\u3067 \u3068\u3044\u305F \u304D\u308D\u304F\u306F\u3001\u304D\u307F\u306E \u5B9F\u529B\u306E \u8A08\u7B97\u306B\u306F \u5165\u308C\u306A\u3044\u3088\u3002 \u3068\u3061\u3085\u3046\u3067 \u304B\u308F\u3063\u305F\u3089\u3001\u53F3\u4E0B\u306E \u30DC\u30BF\u30F3\u3067 \u304D\u308A\u304B\u3048\u3066\u306D\u3002" })] }) }));
    }
    const duo = mode === 'duo';
    return (_jsxs("button", { type: "button", onClick: () => choose(duo ? 'solo' : 'duo'), title: duo ? 'いまは ふたりで つかっている（おすと ひとりに きりかえ）' : 'いまは ひとりで といている（おすと ふたりに きりかえ）', "aria-label": duo ? 'ふたりモード。おすと ひとりに きりかえ' : 'ひとりモード。おすと ふたりに きりかえ', style: S.pill(duo), children: [_jsx("span", { "aria-hidden": true, children: duo ? '●●' : '●' }), duo ? 'DUO' : 'SOLO'] }));
}
//# sourceMappingURL=PlayModeGate.js.map