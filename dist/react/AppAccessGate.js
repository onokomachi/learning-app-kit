import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * 先生がまだ開いていない単元アプリを、名乗った子には使えなくする（2026-10-26）。
 *
 * 単元の開け閉めは PRISM の SOL タブで学級ごとに決める（サーバの class_app_access）。
 * SOL では 🔒 で出るが、子どもはブックマークなどでアプリを直接開くので、アプリの中でも止める。
 * JoinGate の中にあるので、各アプリは何もしなくてよい（kit を上げるだけで入る）。
 * 名乗っていない子・ほかの学級の子は止めない。読めないときも止めない（学習を止めない）。
 * アプリにもどってきたとき（visibilitychange）と、名乗りが変わったときに確かめなおす。
 */
import { useEffect, useState } from 'react';
import { getStudent, subscribeStudent, checkAppOpen, SOL_URL } from '../sync/index.js';
export function AppAccessGate({ config }) {
    const [student, setStudent] = useState(() => getStudent());
    const [closed, setClosed] = useState(false);
    useEffect(() => subscribeStudent((s) => setStudent(s)), []);
    const { supabaseUrl, supabaseKey } = config;
    const studentId = student?.studentId;
    // config はアプリによって毎回新しいオブジェクトで渡ることがあるので、中の値で見る（読みなおしの繰り返しを防ぐ）
    useEffect(() => {
        if (!supabaseUrl || !supabaseKey || !studentId || typeof window === 'undefined') {
            setClosed(false);
            return;
        }
        let alive = true;
        const check = () => {
            void checkAppOpen({ supabaseUrl, supabaseKey }, studentId, window.location.origin).then((open) => { if (alive)
                setClosed(!open); });
        };
        check();
        const onVis = () => { if (!document.hidden)
            check(); };
        document.addEventListener('visibilitychange', onVis);
        return () => { alive = false; document.removeEventListener('visibilitychange', onVis); };
    }, [supabaseUrl, supabaseKey, studentId]);
    if (!closed)
        return null;
    return (_jsx("div", { role: "dialog", "aria-label": "\u307E\u3060 \u3072\u3089\u3044\u3066\u3044\u306A\u3044 \u305F\u3093\u3052\u3093", style: {
            position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(8,12,20,0.86)', backdropFilter: 'blur(4px)',
            display: 'grid', placeItems: 'center', padding: 16,
        }, children: _jsxs("div", { style: {
                width: '100%', maxWidth: 380, background: '#fff', borderRadius: 22, padding: 24, textAlign: 'center', boxSizing: 'border-box',
                fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif', color: '#0f2540',
            }, children: [_jsx("div", { style: { fontSize: 40, lineHeight: 1 }, children: "\uD83D\uDD12" }), _jsx("p", { style: { margin: '12px 0 6px', fontSize: 19, fontWeight: 900 }, children: "\u3053\u306E \u30A2\u30D7\u30EA\u306F \u307E\u3060 \u3072\u3089\u3044\u3066\u3044\u306A\u3044\u3088" }), _jsxs("p", { style: { margin: '0 0 18px', fontSize: 13, lineHeight: 1.7, color: '#54637a' }, children: ["\u305B\u3093\u305B\u3044\u304C \u3072\u3089\u3044\u305F\u3089 \u3064\u304B\u3048\u308B\u3088\u3002", _jsx("br", {}), "SOL \u3067\u3001\u3044\u307E \u3072\u3089\u3044\u3066\u3044\u308B \u30A2\u30D7\u30EA\u3092 \u3048\u3089\u3093\u3067\u306D\u3002"] }), _jsx("a", { href: SOL_URL, style: {
                        display: 'block', borderRadius: 14, padding: '12px 14px', background: '#1d4ed8', color: '#fff',
                        fontWeight: 900, fontSize: 15, textDecoration: 'none',
                    }, children: "SOL \u306B \u3082\u3069\u308B" }), _jsxs("p", { style: { margin: '12px 0 0', fontSize: 11, color: '#8a97ab' }, children: [student?.joinCode, " \u30FB ", student?.number, "\u3070\u3093"] })] }) }));
}
//# sourceMappingURL=AppAccessGate.js.map