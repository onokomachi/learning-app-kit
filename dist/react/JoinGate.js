import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * 名乗りの入口。単元アプリの中に置く。
 *
 * これが要る理由: 子どもはハブを通らず、単元アプリを直接開く。名乗りは
 * ハブから飛んだURLでしか渡らなかったので、7,846件の記録がすべて匿名のまま
 * 溜まっていた（誰の記録か分からず、児童ごとの分析が1つもできなかった）。
 *
 * **「コードを入れずに つかう」を必ず並べる。** このアプリは受け持ちの学級以外の
 * 子も使う。コードを持っていない子に入力を強いると、入口で学習そのものが止まる。
 * 断った子には二度と出さず、あとから設定で名乗れるようにしてある。
 *
 * 見た目は**インラインスタイルで自己完結**させる。12本のアプリはそれぞれ
 * 別のテーマ（マトリックス・桜吹雪など暗い配色もある）を持っていて、
 * クラス名に頼ると、どれかのアプリで文字が背景に沈む。
 */
import { useEffect, useState } from 'react';
import { resolveStudent, claimDevice, chooseAnonymous, getStudent, getJoinChoice, clearStudent, } from '../sync/index.js';
const S = {
    scrim: {
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(8,12,20,0.66)', backdropFilter: 'blur(3px)',
        display: 'grid', placeItems: 'center', padding: 16,
    },
    card: {
        width: '100%', maxWidth: 380, background: '#fff', borderRadius: 22,
        boxShadow: '0 24px 60px -20px rgba(8,12,20,0.5)', padding: 22,
        fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        color: '#0f2540', boxSizing: 'border-box',
    },
    h: { margin: '0 0 6px', fontSize: 19, fontWeight: 900, letterSpacing: '0.01em' },
    p: { margin: '0 0 16px', fontSize: 13, lineHeight: 1.7, color: '#54637a' },
    label: { display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 6, color: '#34445c' },
    input: {
        width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '2px solid #dde4ee',
        padding: '12px 14px', fontSize: 16, color: '#0f2540', background: '#fff', outline: 'none',
    },
    primary: {
        width: '100%', borderRadius: 12, border: 0, background: '#0ea5e9', color: '#fff',
        fontWeight: 900, fontSize: 16, padding: '13px 0', cursor: 'pointer',
    },
    ghost: {
        width: '100%', marginTop: 10, borderRadius: 12, border: '1px solid #e2e8f0',
        background: '#fff', color: '#54637a', fontWeight: 800, fontSize: 13,
        padding: '11px 0', cursor: 'pointer',
    },
    err: {
        marginTop: 10, fontSize: 13, color: '#be123c', background: '#fff1f2',
        border: '1px solid #fecdd3', borderRadius: 12, padding: '8px 12px',
    },
    note: { marginTop: 14, fontSize: 11, lineHeight: 1.7, color: '#8496ad' },
};
/** 入力フォームの中身だけ。ゲートにも設定パネルにも同じものを使う */
function JoinForm({ config, onDone, onSkip, onClose }) {
    const [code, setCode] = useState(() => getStudent()?.joinCode ?? '');
    const [num, setNum] = useState(() => {
        const n = getStudent()?.number;
        return n ? String(n) : '';
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(null);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const r = await resolveStudent(config, code, Number(num));
        if (!r.ok) {
            setBusy(false);
            setError(r.message);
            return;
        }
        // 名乗る前にこの端末が送っていた分も、その子のものにする
        const c = await claimDevice(config, r.student.studentId);
        setBusy(false);
        const claimed = c.events + c.tests;
        setDone({ student: r.student, claimed });
        onDone?.(r.student, claimed);
    };
    if (done) {
        return (_jsxs("div", { children: [_jsxs("h2", { style: S.h, children: ["\u3042\u308A\u304C\u3068\u3046\u3001", done.student.number, "\u3070\u3093\u3055\u3093"] }), _jsxs("p", { style: S.p, children: ["\u3053\u308C\u304B\u3089\u306E \u304D\u308D\u304F\u304C \u305B\u3093\u305B\u3044\u306B \u3068\u3069\u304F\u3088\u3002", done.claimed > 0 && _jsxs(_Fragment, { children: ["\u3044\u307E\u307E\u3067\u306E ", _jsx("b", { children: done.claimed }), " \u3051\u3093\u3082 \u3044\u3063\u3057\u3087\u306B \u3068\u3069\u3044\u305F\u3088\u3002"] })] }), _jsx("button", { type: "button", style: S.primary, onClick: () => onClose?.(), children: "\u3068\u3058\u308B" })] }));
    }
    return (_jsxs("form", { onSubmit: submit, children: [_jsx("h2", { style: S.h, children: "\u3058\u3076\u3093\u306E\u3053\u3068\u3092 \u304A\u3057\u3048\u3066\u306D" }), _jsx("p", { style: S.p, children: "\u306A\u307E\u3048\u306F \u304D\u304B\u306A\u3044\u3088\u3002\u300C\u3069\u306E\u5B66\u7D1A\u306E \u306A\u3093\u3070\u3093\u306E\u4EBA\u304B\u300D\u3060\u3051\u304C \u304D\u308D\u304F\u3055\u308C\u308B\u3088\u3002" }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("label", { style: S.label, htmlFor: "lak-join-code", children: "\u304C\u3063\u304D\u3085\u3046\u30B3\u30FC\u30C9" }), _jsx("input", { id: "lak-join-code", style: S.input, value: code, required: true, onChange: (e) => setCode(e.target.value), placeholder: "\u305B\u3093\u305B\u3044\u304B\u3089 \u304D\u3044\u3066\u306D" })] }), _jsxs("div", { style: { marginBottom: 16 }, children: [_jsx("label", { style: S.label, htmlFor: "lak-join-num", children: "\u3057\u3085\u3063\u305B\u304D\u756A\u53F7" }), _jsx("input", { id: "lak-join-num", style: S.input, value: num, required: true, type: "number", inputMode: "numeric", min: 1, max: 100, onChange: (e) => setNum(e.target.value), placeholder: "12" })] }), _jsx("button", { type: "submit", style: { ...S.primary, opacity: busy ? 0.6 : 1 }, disabled: busy, children: busy ? 'おくっているよ…' : 'はじめる' }), onSkip && (_jsx("button", { type: "button", style: S.ghost, onClick: onSkip, children: "\u30B3\u30FC\u30C9\u3092 \u5165\u308C\u305A\u306B \u3064\u304B\u3046" })), onClose && !onSkip && (_jsx("button", { type: "button", style: S.ghost, onClick: onClose, children: "\u3084\u3081\u308B" })), error && _jsx("p", { style: S.err, children: error }), _jsx("p", { style: S.note, children: "\u30B3\u30FC\u30C9\u304C \u306A\u304F\u3066\u3082 \u305C\u3093\u3076 \u3064\u304B\u3048\u308B\u3088\u3002\u3042\u3068\u304B\u3089 \u300C\u305B\u3063\u3066\u3044\u300D\u3067 \u5165\u308C\u308B\u3053\u3068\u3082 \u3067\u304D\u308B\u3088\u3002" })] }));
}
/**
 * まだ決めていない子にだけ、はじめの1回だけ出す。
 * 名乗った子にも、断った子にも、二度と出ない。
 */
export function JoinGate({ config }) {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        // 接続先が無いアプリ（ポータルにつないでいない）では出さない
        if (!config.supabaseUrl || !config.supabaseKey)
            return;
        // ハブから来た子は名乗りが済んでいる。決めていない子にだけ出す
        if (getJoinChoice() !== null || getStudent() !== null)
            return;
        setOpen(true);
    }, [config.supabaseUrl, config.supabaseKey]);
    if (!open)
        return null;
    return (_jsx("div", { style: S.scrim, role: "dialog", "aria-label": "\u304C\u3063\u304D\u3085\u3046\u30B3\u30FC\u30C9\u306E\u5165\u529B", children: _jsx("div", { style: S.card, children: _jsx(JoinForm, { config: config, onSkip: () => { chooseAnonymous(); setOpen(false); }, onClose: () => setOpen(false) }) }) }));
}
/**
 * 設定パネルに置く1行。いまの状態を見せ、押すと名乗り直せる。
 * 「コードを入れずに つかう」を選んだ子の、あとからの入口になる。
 */
export function JoinSettingsRow({ config }) {
    const [student, setStudent] = useState(() => getStudent());
    const [open, setOpen] = useState(false);
    if (!config.supabaseUrl || !config.supabaseKey)
        return null;
    return (_jsxs("div", { style: {
            fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        }, children: [_jsxs("div", { style: {
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                    border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px 14px', background: '#f8fafc',
                }, children: [_jsxs("div", { style: { minWidth: 0, flex: 1 }, children: [_jsx("p", { style: { margin: 0, fontSize: 12, fontWeight: 800, color: '#34445c' }, children: "\u304C\u3063\u304D\u3085\u3046\u30B3\u30FC\u30C9" }), _jsx("p", { style: { margin: '2px 0 0', fontSize: 13, color: '#54637a' }, children: student
                                    ? `${student.joinCode}　${student.number}ばん`
                                    : 'まだ 入れていないよ（きろくは この たんまつだけ）' })] }), _jsx("button", { type: "button", onClick: () => setOpen(true), style: {
                            border: 0, borderRadius: 10, background: '#0ea5e9', color: '#fff',
                            fontWeight: 900, fontSize: 13, padding: '9px 14px', cursor: 'pointer',
                        }, children: student ? '入れなおす' : '入れる' }), student && (_jsx("button", { type: "button", onClick: () => { clearStudent(); setStudent(null); }, style: {
                            border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff',
                            color: '#8496ad', fontWeight: 800, fontSize: 12, padding: '9px 12px', cursor: 'pointer',
                        }, children: "\u3051\u3059" }))] }), open && (_jsx("div", { style: S.scrim, role: "dialog", "aria-label": "\u304C\u3063\u304D\u3085\u3046\u30B3\u30FC\u30C9\u306E\u5165\u529B", children: _jsx("div", { style: S.card, children: _jsx(JoinForm, { config: config, onDone: (s) => setStudent(s), onClose: () => setOpen(false) }) }) }))] }));
}
//# sourceMappingURL=JoinGate.js.map