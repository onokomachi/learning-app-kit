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
import { resolveStudent, claimDevice, chooseAnonymous, getStudent, getJoinChoice, clearStudent, subscribeStudent, verifyUnlock, verifyDemoCode, DEMO_JOIN, } from '../sync/index.js';
import { PlayModeGate } from './PlayModeGate.js';
import { AppAccessGate } from './AppAccessGate.js';
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
function JoinForm({ config, onDone, onSkip, onClose, onDemo }) {
    const [code, setCode] = useState(() => getStudent()?.joinCode ?? '');
    const [num, setNum] = useState(() => {
        const n = getStudent()?.number;
        return n ? String(n) : '';
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(null);
    // 入れまちがいを減らすため、送る前に1回「これで いい？」と聞く
    const [confirming, setConfirming] = useState(false);
    const [demo, setDemo] = useState(null);
    const [demoCode, setDemoCode] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        // デモモードの合いことば（0000・0）なら、名乗らずに先生のパスワードを聞く
        if (onDemo && code.trim() === DEMO_JOIN.code && Number(num) === DEMO_JOIN.number) {
            setError(null);
            setDemo('ask');
            return;
        }
        if (!confirming) {
            setError(null);
            setConfirming(true);
            return;
        }
        setConfirming(false);
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
    if (demo === 'ask' && onDemo) {
        const go = async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const r = await verifyDemoCode(config, demoCode);
            setBusy(false);
            if (r.ok)
                onDemo();
            else {
                setError(r.message);
                setDemoCode('');
            }
        };
        return (_jsxs("form", { onSubmit: go, children: [_jsx("h2", { style: S.h, children: "\u30C7\u30E2\u30E2\u30FC\u30C9" }), _jsx("p", { style: S.p, children: "\u30A2\u30D7\u30EA\u306E \u3057\u3087\u3046\u304B\u3044\u7528\u3002\u3059\u3079\u3066\u306E\u753A\u304C \u3072\u3089\u304D\u3001\u304D\u308D\u304F\u306F \u3069\u3053\u306B\u3082 \u304A\u304F\u3089\u308C\u306A\u3044\u3088\u3002\u305B\u3093\u305B\u3044\u306E \u30D1\u30B9\u30EF\u30FC\u30C9\u3092 \u5165\u308C\u3066\u306D\u3002" }), _jsx("input", { style: { ...S.input, letterSpacing: '0.3em', marginBottom: 14 }, value: demoCode, required: true, autoFocus: true, type: "password", inputMode: "numeric", autoComplete: "off", "aria-label": "\u30D1\u30B9\u30EF\u30FC\u30C9", onChange: (e) => setDemoCode(e.target.value.replace(/[^0-9]/g, '')) }), _jsx("button", { type: "submit", style: { ...S.primary, opacity: busy ? 0.6 : 1 }, disabled: busy || !demoCode, children: busy ? 'たしかめているよ…' : 'デモを はじめる' }), _jsx("button", { type: "button", style: S.ghost, onClick: () => { setDemo(null); setError(null); }, children: "\u3082\u3069\u308B" }), error && _jsx("p", { style: S.err, children: error })] }));
    }
    if (confirming) {
        return (_jsxs("form", { onSubmit: submit, children: [_jsx("h2", { style: S.h, children: "\u3053\u308C\u3067 \u3044\u3044\uFF1F" }), _jsxs("p", { style: { ...S.p, fontSize: 15, color: '#0f2540' }, children: ["\u304C\u3063\u304D\u3085\u3046\u30B3\u30FC\u30C9 ", _jsx("b", { children: code.trim() }), " \u306E ", _jsx("b", { style: { fontSize: 20 }, children: num }), " \u3070\u3093"] }), _jsx("p", { style: S.note, children: "\u307E\u3061\u304C\u3048\u308B\u3068\u3001\u307B\u304B\u306E\u4EBA\u306E \u304D\u308D\u304F\u306B \u306A\u3063\u3066\u3057\u307E\u3046\u3088\u3002\u3042\u3068\u304B\u3089 \u304B\u3048\u308B\u306B\u306F \u305B\u3093\u305B\u3044\u306E \u30D1\u30B9\u30EF\u30FC\u30C9\u304C \u3044\u308B\u3088\u3002" }), _jsx("button", { type: "submit", style: S.primary, children: "\u306F\u3044\u3001\u306F\u3058\u3081\u308B" }), _jsx("button", { type: "button", style: S.ghost, onClick: () => setConfirming(false), children: "\u306A\u304A\u3059" })] }));
    }
    return (_jsxs("form", { onSubmit: submit, children: [_jsx("h2", { style: S.h, children: "\u3058\u3076\u3093\u306E\u3053\u3068\u3092 \u304A\u3057\u3048\u3066\u306D" }), _jsx("p", { style: S.p, children: "\u306A\u307E\u3048\u306F \u304D\u304B\u306A\u3044\u3088\u3002\u300C\u3069\u306E\u5B66\u7D1A\u306E \u306A\u3093\u3070\u3093\u306E\u4EBA\u304B\u300D\u3060\u3051\u304C \u304D\u308D\u304F\u3055\u308C\u308B\u3088\u3002" }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("label", { style: S.label, htmlFor: "lak-join-code", children: "\u304C\u3063\u304D\u3085\u3046\u30B3\u30FC\u30C9" }), _jsx("input", { id: "lak-join-code", style: S.input, value: code, required: true, onChange: (e) => setCode(e.target.value), placeholder: "\u305B\u3093\u305B\u3044\u304B\u3089 \u304D\u3044\u3066\u306D" })] }), _jsxs("div", { style: { marginBottom: 16 }, children: [_jsx("label", { style: S.label, htmlFor: "lak-join-num", children: "\u3057\u3085\u3063\u305B\u304D\u756A\u53F7" }), _jsx("input", { id: "lak-join-num", style: S.input, value: num, required: true, type: "number", inputMode: "numeric", min: onDemo ? 0 : 1, max: 100, onChange: (e) => setNum(e.target.value), placeholder: "12" })] }), _jsx("button", { type: "submit", style: { ...S.primary, opacity: busy ? 0.6 : 1 }, disabled: busy, children: busy ? 'おくっているよ…' : 'はじめる' }), onSkip && (_jsx("button", { type: "button", style: S.ghost, onClick: onSkip, children: "\u30B3\u30FC\u30C9\u3092 \u5165\u308C\u305A\u306B \u3064\u304B\u3046" })), onClose && !onSkip && (_jsx("button", { type: "button", style: S.ghost, onClick: onClose, children: "\u3084\u3081\u308B" })), error && _jsx("p", { style: S.err, children: error }), _jsx("p", { style: S.note, children: "\u30B3\u30FC\u30C9\u304C \u306A\u304F\u3066\u3082 \u305C\u3093\u3076 \u3064\u304B\u3048\u308B\u3088\u3002\u3042\u3068\u304B\u3089 \u300C\u305B\u3063\u3066\u3044\u300D\u3067 \u5165\u308C\u308B\u3053\u3068\u3082 \u3067\u304D\u308B\u3088\u3002" })] }));
}
/**
 * 名乗った子が「けす」「入れなおす」をする前に出す、先生のパスワードの入力（ハブでも使う）。
 * 答え合わせはサーバ（verifyUnlock）。あっていたら onUnlocked。
 */
export function UnlockPrompt({ config, student, action, onUnlocked, onClose }) {
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const r = await verifyUnlock(config, student.joinCode, code);
        setBusy(false);
        if (r.ok)
            onUnlocked();
        else {
            setError(r.message);
            setCode('');
        }
    };
    return (_jsx("div", { style: S.scrim, role: "dialog", "aria-label": "\u305B\u3093\u305B\u3044\u306E \u30D1\u30B9\u30EF\u30FC\u30C9", children: _jsx("div", { style: S.card, children: _jsxs("form", { onSubmit: submit, children: [_jsx("h2", { style: S.h, children: "\u305B\u3093\u305B\u3044\u306E \u30D1\u30B9\u30EF\u30FC\u30C9" }), _jsxs("p", { style: S.p, children: ["\u3044\u307E\u306F ", _jsxs("b", { children: [student.joinCode, "\u3000", student.number, "\u3070\u3093"] }), "\u3002", action, "\u306B\u306F\u3001\u305B\u3093\u305B\u3044\u306B \u30D1\u30B9\u30EF\u30FC\u30C9\u3092 \u5165\u308C\u3066\u3082\u3089\u3063\u3066\u306D\u3002"] }), _jsx("input", { style: { ...S.input, letterSpacing: '0.3em', marginBottom: 14 }, value: code, required: true, autoFocus: true, type: "password", inputMode: "numeric", autoComplete: "off", "aria-label": "\u30D1\u30B9\u30EF\u30FC\u30C9", onChange: (e) => setCode(e.target.value.replace(/[^0-9]/g, '')) }), _jsx("button", { type: "submit", style: { ...S.primary, opacity: busy ? 0.6 : 1 }, disabled: busy || !code, children: busy ? 'たしかめているよ…' : 'OK' }), _jsx("button", { type: "button", style: S.ghost, onClick: onClose, children: "\u3084\u3081\u308B" }), error && _jsx("p", { style: S.err, children: error })] }) }) }));
}
/**
 * まだ名乗っていない端末に、画面のすみに小さく出し続ける入口。
 *
 * これが要る理由: 名乗りの画面ははじめの1回しか出ない。そこで「コードを入れずに つかう」を
 * 押した端末や、たまたま閉じてしまった端末は、アプリに「せってい」が無いと二度と名乗れない。
 * 実際、国語の4本には入口が無く、ごんぎつねの記録はすべて匿名のまま届いていた
 * （先生の画面で番号ごとの分析ができない。画面上は正常に見えるので気づけない）。
 * JoinGate に入れておけば、どのアプリも kit を上げるだけで入口がつく。
 *
 * 名乗った端末には出さない（授業中にじゃまにならないように）。
 */
function JoinChip({ config, position, onOpen }) {
    const [student, setStudent] = useState(() => getStudent());
    useEffect(() => subscribeStudent(setStudent), []);
    if (!config.supabaseUrl || !config.supabaseKey || student)
        return null;
    const [v, h] = position.split('-');
    return (_jsx("button", { type: "button", onClick: onOpen, "aria-label": "\u304C\u3063\u304D\u3085\u3046\u30B3\u30FC\u30C9\u3092\u5165\u308C\u308B", style: {
            position: 'fixed', [v]: 12, [h]: 12, zIndex: 9990, // SOLO/DUO の札（右下 12px）と同じ位置
            border: '1px solid #bae6fd', borderRadius: 999, background: 'rgba(240,249,255,0.95)',
            color: '#0369a1', fontWeight: 800, fontSize: 12, padding: '6px 12px', cursor: 'pointer',
            boxShadow: '0 4px 12px -6px rgba(8,12,20,0.35)',
            fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        }, children: "\u304C\u3063\u304D\u3085\u3046\u30B3\u30FC\u30C9\u3092 \u5165\u308C\u308B" }));
}
export function JoinGate({ config, chip = 'bottom-right' }) {
    const [open, setOpen] = useState(false);
    // すみの入口から開いたとき（「コードを入れずに つかう」は出さず「やめる」にする）
    const [fromChip, setFromChip] = useState(false);
    useEffect(() => {
        // 接続先が無いアプリ（ポータルにつないでいない）では出さない
        if (!config.supabaseUrl || !config.supabaseKey)
            return;
        // ハブから来た子は名乗りが済んでいる。決めていない子にだけ出す
        if (getJoinChoice() !== null || getStudent() !== null)
            return;
        setOpen(true);
    }, [config.supabaseUrl, config.supabaseKey]);
    const configured = !!config.supabaseUrl && !!config.supabaseKey;
    if (!open) {
        return (_jsxs(_Fragment, { children: [_jsx(PlayModeGate, { enabled: configured }), _jsx(AppAccessGate, { config: config }), chip && _jsx(JoinChip, { config: config, position: chip, onOpen: () => { setFromChip(true); setOpen(true); } })] }));
    }
    return (_jsx("div", { style: S.scrim, role: "dialog", "aria-label": "\u304C\u3063\u304D\u3085\u3046\u30B3\u30FC\u30C9\u306E\u5165\u529B", children: _jsx("div", { style: S.card, children: _jsx(JoinForm, { config: config, onSkip: fromChip ? undefined : () => { chooseAnonymous(); setOpen(false); }, onClose: () => { setOpen(false); setFromChip(false); } }) }) }));
}
/**
 * 設定パネルに置く1行。いまの状態を見せ、押すと名乗り直せる。
 * 「コードを入れずに つかう」を選んだ子の、あとからの入口になる。
 */
export function JoinSettingsRow({ config, onDemo }) {
    const [student, setStudent] = useState(() => getStudent());
    const [open, setOpen] = useState(false);
    // 名乗った子が変えるときは、先に先生のパスワード（なりすまし・ぬけて戻る のいたずらを防ぐ）
    const [unlock, setUnlock] = useState(null);
    if (!config.supabaseUrl || !config.supabaseKey)
        return null;
    return (_jsxs("div", { style: {
            fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        }, children: [_jsxs("div", { style: {
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                    border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px 14px', background: '#f8fafc',
                }, children: [_jsxs("div", { style: { minWidth: 0, flex: 1 }, children: [_jsx("p", { style: { margin: 0, fontSize: 12, fontWeight: 800, color: '#34445c' }, children: "\u304C\u3063\u304D\u3085\u3046\u30B3\u30FC\u30C9" }), _jsx("p", { style: { margin: '2px 0 0', fontSize: 13, color: '#54637a' }, children: student
                                    ? `${student.joinCode}　${student.number}ばん`
                                    : 'まだ 入れていないよ（きろくは この たんまつだけ）' })] }), _jsx("button", { type: "button", onClick: () => (student ? setUnlock('rejoin') : setOpen(true)), style: {
                            border: 0, borderRadius: 10, background: '#0ea5e9', color: '#fff',
                            fontWeight: 900, fontSize: 13, padding: '9px 14px', cursor: 'pointer',
                        }, children: student ? '入れなおす' : '入れる' }), student && (_jsx("button", { type: "button", onClick: () => setUnlock('clear'), style: {
                            border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff',
                            color: '#8496ad', fontWeight: 800, fontSize: 12, padding: '9px 12px', cursor: 'pointer',
                        }, children: "\u3051\u3059" }))] }), unlock && student && (_jsx(UnlockPrompt, { config: config, student: student, action: unlock === 'clear' ? 'けすの' : '入れなおすの', onClose: () => setUnlock(null), onUnlocked: () => {
                    const what = unlock;
                    setUnlock(null);
                    if (what === 'clear') {
                        clearStudent();
                        setStudent(null);
                    }
                    else
                        setOpen(true);
                } })), open && (_jsx("div", { style: S.scrim, role: "dialog", "aria-label": "\u304C\u3063\u304D\u3085\u3046\u30B3\u30FC\u30C9\u306E\u5165\u529B", children: _jsx("div", { style: S.card, children: _jsx(JoinForm, { config: config, onDone: (s) => setStudent(s), onClose: () => setOpen(false), onDemo: onDemo ? () => { setOpen(false); onDemo(); } : undefined }) }) }))] }));
}
//# sourceMappingURL=JoinGate.js.map