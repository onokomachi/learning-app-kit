import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * 分数のけいさんらん — 通分・約分・くり上げ・くり下げを、紙に書くかわりにアプリの中でするための場所。
 *
 * 分数の計算は、答えの分数を書くまでに「書くこと」が多い。
 *   倍数を ならべる／分母を そろえて ×k の矢印を 書く／斜線を ひいて ÷g を 書く／
 *   1 くり下げて 書きなおす／仮分数と 帯分数を 行ったり来たりする
 * 専用の場所が無いと、子どもは紙で書いてから答えを打つことになり、「アプリの中で完結する」体験が崩れる
 * （わり算の筆算の ScratchPad と同じ考え方。master-DB: patterns/scratch-calculation-corner-for-hard-arithmetic.md）。
 *
 * **考えるのは子ども、書く手間を減らすのが この道具。**
 *   子どもが決める … 共通の分母／何で約分するか／どこで くり下げるか／各欄の数
 *   道具が かわりに … 倍数の列／「×k」「÷g」の矢印／斜線と書きなおし
 * 5つの道具（tools で絞れる。先頭が、開いたときに選ばれている道具）:
 *   multiples … 倍数を ならべて、○を つけて 同じ数を さがす（最小公倍数）
 *   common    … 通分。共通の分母を入れると ×k の矢印が出る。分子は子どもが書く。たす・ひくの欄つき
 *   reduce    … 約分。÷2 ÷3 ÷5 ÷7 か 好きな数で わる。斜線と ÷g が 書かれる。わりきれない数は 理由が出る
 *   convert   … 仮分数→帯分数（わり算の欄＋たしかめ＋くり上げ）／帯分数→仮分数
 *   borrow    … 帯分数・整数の「1 くり下げる」。斜線と書きなおしが出る
 *
 * **採点はしない。保存も送信もしない。** 「合っている」「まちがい」は言わない（元の問題の入力らんが判定する）。
 * **数は子どもが入れる。** 問題の数を はじめから入れて よいのは、数が問題文にそのまま書いてある場面だけ（initial）。
 *
 * 見た目はインラインスタイルで自己完結させる（単元アプリは暗い配色のテーマも持つため）。
 */
import { useState } from 'react';
import { toInt, toInt0, multiplesOf, sharedCircled, scaleFactor, applyDivisor, reduceChain, borrowOne, divCheck, } from './fractionPadLogic.js';
const INK = '#0f2540';
const RED = '#e11d48';
const AMBER = '#b45309';
const BLUE = '#0369a1';
const FONT = 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
const TOOL_LABEL = {
    multiples: '倍数を ならべる', common: '通分', reduce: '約分', convert: '仮分数・帯分数', borrow: 'くり下げ',
};
const ALL_TOOLS = ['multiples', 'common', 'reduce', 'convert', 'borrow'];
const S = {
    wrap: {
        borderRadius: 18, border: '2px dashed #bcd3ec', background: '#f7fbff',
        padding: 14, marginTop: 10, marginBottom: 10, fontFamily: FONT, color: INK, textAlign: 'left',
    },
    head: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
    title: { fontSize: 12, fontWeight: 800, color: '#2f4d75', margin: 0 },
    tab: (on) => ({
        border: 0, borderRadius: 10, cursor: 'pointer', fontWeight: 900, fontSize: 13,
        padding: '6px 11px', background: on ? '#0ea5e9' : '#e8eff8', color: on ? '#fff' : '#54637a',
    }),
    box: (on, w) => ({
        minWidth: w, height: 40, padding: '0 8px', borderRadius: 8, cursor: 'pointer', boxSizing: 'border-box',
        display: 'inline-grid', placeItems: 'center', fontSize: 21, fontWeight: 900, color: INK,
        background: on ? '#e0f2fe' : '#fff', border: on ? '2px solid #0ea5e9' : '1px solid #cfdcec', letterSpacing: 1,
    }),
    key: {
        minWidth: 42, height: 40, borderRadius: 8, border: '1px solid #cfdcec', background: '#f2f7fd',
        fontSize: 17, fontWeight: 800, color: '#2f4d75', cursor: 'pointer', padding: '0 8px',
    },
    ghost: {
        border: '1px solid #dbe4f0', borderRadius: 10, background: '#fff',
        color: '#64748b', fontWeight: 800, fontSize: 12, padding: '6px 12px', cursor: 'pointer',
    },
    tool: (on = false) => ({
        border: on ? `2px solid ${RED}` : '1px solid #bcd3ec', borderRadius: 10,
        background: on ? '#fff1f2' : '#fff', color: on ? RED : BLUE,
        fontWeight: 900, fontSize: 14, padding: '7px 12px', cursor: 'pointer',
    }),
    label: { fontSize: 11, color: '#8496ad', fontWeight: 700, margin: '0 0 4px' },
    msg: { fontSize: 12, color: RED, fontWeight: 800, margin: '8px 0 0' },
    note: { fontSize: 11, color: '#8496ad', marginTop: 10, marginBottom: 0, lineHeight: 1.7 },
    row: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10 },
    op: { fontSize: 22, fontWeight: 900, color: '#7c8da6' },
};
/** 縦書きの分数。size は 数字の大きさ（px） */
function Fr({ n, d, w, size = 22, color = INK }) {
    return (_jsxs("span", { style: { display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 900, fontSize: size, color }, children: [w !== undefined && w !== null && _jsx("span", { children: w }), _jsxs("span", { style: { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05 }, children: [_jsx("span", { style: { padding: '0 4px' }, children: n }), _jsx("span", { style: { alignSelf: 'stretch', borderTop: '2.5px solid currentColor', margin: '2px 0' } }), _jsx("span", { style: { padding: '0 4px' }, children: d })] })] }));
}
/** 斜線を ひいて 消した もの。now は 上に 小さく書く 新しい 数（赤） */
function Struck({ children, now }) {
    return (_jsxs("span", { style: { position: 'relative', display: 'inline-block', padding: '0 4px', opacity: 0.75 }, children: [now !== undefined && (_jsx("span", { style: {
                    position: 'absolute', top: -18, left: 0, right: 0, textAlign: 'center', fontSize: 13, fontWeight: 900,
                    color: RED, whiteSpace: 'nowrap', opacity: 1,
                }, children: now })), children, _jsx("span", { style: {
                    position: 'absolute', left: '-6%', top: '50%', width: '112%', height: 2.5, background: RED,
                    transform: 'rotate(-24deg)', borderRadius: 2, pointerEvents: 'none',
                } })] }));
}
/** 矢印（×k・÷g の ラベルつき） */
function Arrow({ label }) {
    return (_jsxs("span", { style: { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', color: RED, fontWeight: 900 }, children: [_jsx("span", { style: { fontSize: 14 }, children: label }), _jsx("span", { style: { fontSize: 22, lineHeight: 1 }, children: "\u27F6" })] }));
}
const maxLen = (id) => (id.startsWith('mul.') ? 2 : 3);
function initialFields(initial) {
    const f = {};
    if (!initial)
        return f;
    if (initial.multiples) {
        f['mul.a'] = String(initial.multiples[0]);
        f['mul.b'] = String(initial.multiples[1]);
    }
    if (initial.fractions) {
        initial.fractions.slice(0, 3).forEach(([n, d], i) => { f[`com.n${i + 1}`] = String(n); f[`com.d${i + 1}`] = String(d); });
        const [n, d] = initial.fractions[0] ?? [];
        if (n && d) {
            f['red.n'] = String(n);
            f['red.d'] = String(d);
        }
    }
    if (initial.mixed) {
        const { w, n, d } = initial.mixed;
        if (w > 0) {
            f['cv.w'] = String(w);
            f['bo.w'] = String(w);
        }
        if (n >= 0) {
            f['cv.n'] = String(n);
            f['bo.n'] = n > 0 ? String(n) : '';
        }
        f['cv.d'] = String(d);
        f['bo.d'] = String(d);
    }
    return f;
}
export function FractionPad({ tools = ALL_TOOLS, initial }) {
    const list = tools.length ? tools : ALL_TOOLS;
    const [tool, setTool] = useState(initial?.tool && list.includes(initial.tool) ? initial.tool : list[0]);
    const [fields, setFields] = useState(() => initialFields(initial));
    const [active, setActive] = useState(null);
    const [msg, setMsg] = useState(null);
    // 道具ごとの状態
    const [mulCount, setMulCount] = useState(10);
    const [circA, setCircA] = useState([]);
    const [circB, setCircB] = useState([]);
    const [nf, setNf] = useState(Math.min(3, Math.max(2, initial?.fractions?.length ?? 2)));
    const [comOp, setComOp] = useState('+');
    const [gs, setGs] = useState([]);
    const [cvMode, setCvMode] = useState('toMixed');
    const [borrowed, setBorrowed] = useState(false);
    const val = (id) => fields[id] ?? '';
    /* ---------- 入力 ---------- */
    const touched = (id) => {
        if (id === 'red.n' || id === 'red.d')
            setGs([]);
        if (id === 'bo.w' || id === 'bo.n' || id === 'bo.d')
            setBorrowed(false);
    };
    const put = (v) => {
        if (!active) {
            setMsg('書きたい 箱を おしてね。');
            return;
        }
        const cur = val(active);
        if (cur.length >= maxLen(active))
            return;
        setFields((f) => ({ ...f, [active]: cur === '0' ? v : cur + v }));
        touched(active);
        setMsg(null);
    };
    const back = () => {
        if (!active)
            return;
        setFields((f) => ({ ...f, [active]: val(active).slice(0, -1) }));
        touched(active);
    };
    /** ▶ で たどる 箱の じゅん（いま 見えている 箱） */
    const order = () => {
        switch (tool) {
            case 'multiples': return ['mul.a', 'mul.b'];
            case 'common': {
                const ids = [];
                for (let i = 1; i <= nf; i++)
                    ids.push(`com.n${i}`, `com.d${i}`);
                ids.push('com.L');
                for (let i = 1; i <= nf; i++)
                    ids.push(`com.x${i}`);
                ids.push('com.s');
                return ids;
            }
            case 'reduce': return ['red.n', 'red.d', 'red.g'];
            case 'convert': return cvMode === 'toMixed' ? ['cv.w', 'cv.n', 'cv.d', 'cv.q', 'cv.r'] : ['cv.w', 'cv.n', 'cv.d', 'cv.x'];
            case 'borrow': return ['bo.w', 'bo.n', 'bo.d', 'bo.a', 'bo.b'];
        }
    };
    const next = () => {
        const o = order();
        const i = active ? o.indexOf(active) : -1;
        setActive(o[(i + 1) % o.length]);
    };
    const box = (id, label, w = 52) => (_jsx("button", { type: "button", "aria-label": label, onClick: () => { setActive(id); setMsg(null); }, style: S.box(active === id, w), children: val(id) || _jsx("span", { style: { color: '#b6c3d4' }, children: "\u25A1" }) }, id));
    const clearTool = () => {
        const prefix = { multiples: 'mul.', common: 'com.', reduce: 'red.', convert: 'cv.', borrow: 'bo.' }[tool];
        setFields((f) => Object.fromEntries(Object.entries(f).filter(([k]) => !k.startsWith(prefix))));
        setCircA([]);
        setCircB([]);
        setGs([]);
        setBorrowed(false);
        setMsg(null);
        setActive(null);
        if (tool === 'common')
            setNf(2);
    };
    /* ---------- 倍数を ならべる ---------- */
    const renderMultiples = () => {
        const a = toInt(val('mul.a'));
        const b = toInt(val('mul.b'));
        const rowA = a ? multiplesOf(a, mulCount) : [];
        const rowB = b ? multiplesOf(b, mulCount) : [];
        const cA = circA.filter((v) => rowA.includes(v));
        const cB = circB.filter((v) => rowB.includes(v));
        const shared = new Set(sharedCircled(cA, cB));
        const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
        const chips = (row, base, circ, set, cur) => (_jsx("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }, children: row.map((v, i) => {
                const on = circ.includes(v);
                const star = on && shared.has(v);
                return (_jsxs("button", { type: "button", "aria-label": `${base}の倍数 ${v}`, "aria-pressed": on, onClick: () => toggle(cur, set, v), style: {
                        minWidth: 46, padding: '4px 6px', borderRadius: 999, cursor: 'pointer', textAlign: 'center',
                        fontWeight: 900, fontSize: 17, color: INK,
                        background: star ? '#fef3c7' : '#fff', border: star ? `2.5px solid ${AMBER}` : on ? `2.5px solid ${RED}` : '1px solid #cfdcec',
                    }, children: [star && _jsx("span", { style: { color: AMBER, fontSize: 12 }, children: "\u2605" }), v, _jsxs("span", { style: { display: 'block', fontSize: 9, color: '#8496ad', fontWeight: 700 }, children: [base, "\u00D7", i + 1] })] }, v));
            }) }));
        return (_jsxs(_Fragment, { children: [_jsx("p", { style: S.label, children: "2\u3064\u306E \u6570\u3092 \u5165\u308C\u3066\u306D\u3002\u500D\u6570\u304C \u306A\u3089\u3076\u3088\u3002" }), _jsxs("div", { style: { ...S.row, marginTop: 0 }, children: [box('mul.a', '1つめの数', 56), _jsx("span", { style: S.op, children: "\u3068" }), box('mul.b', '2つめの数', 56), _jsx("span", { style: { fontWeight: 800, fontSize: 13 }, children: "\u306E \u500D\u6570" })] }), a && (_jsxs("div", { style: { marginTop: 10 }, children: [_jsxs("span", { style: { fontSize: 13, fontWeight: 900 }, children: [a, " \u306E \u500D\u6570"] }), chips(rowA, a, cA, setCircA, circA)] })), b && (_jsxs("div", { style: { marginTop: 10 }, children: [_jsxs("span", { style: { fontSize: 13, fontWeight: 900 }, children: [b, " \u306E \u500D\u6570"] }), chips(rowB, b, cB, setCircB, circB)] })), (a || b) && mulCount < 40 && (_jsx("div", { style: { marginTop: 10 }, children: _jsx("button", { type: "button", style: S.tool(), onClick: () => setMulCount((n) => Math.min(40, n + 6)), children: "\u3082\u3063\u3068 \u3075\u3084\u3059" }) })), _jsx("p", { style: S.note, children: "\u540C\u3058\u6570\u3092 \u898B\u3064\u3051\u305F\u3089\u3001\u3069\u3061\u3089\u306E\u884C\u3067\u3082 \u25CB\u3067 \u304B\u3053\u3082\u3046\u3002\u3069\u3061\u3089\u3082 \u25CB\u306B \u3057\u305F \u6570\u306B\u306F \u2605\u304C \u3064\u304F\u3088\u3002\u3044\u3061\u3070\u3093 \u5C0F\u3055\u3044 \u2605\u304C \u6700\u5C0F\u516C\u500D\u6570\u3002" })] }));
    };
    /* ---------- 通分 ---------- */
    const renderCommon = () => {
        const L = toInt(val('com.L'));
        const rows = Array.from({ length: nf }, (_, i) => i + 1);
        const xs = rows.map((i) => toInt0(val(`com.x${i}`)));
        const okRows = rows.filter((i) => toInt(val(`com.n${i}`)) && toInt(val(`com.d${i}`)));
        return (_jsxs(_Fragment, { children: [_jsx("p", { style: S.label, children: "\u901A\u5206\u3057\u305F\u3044 \u5206\u6570\u3092 \u5165\u308C\u3066\u306D\u3002" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }, children: [rows.map((i) => (_jsxs("span", { style: { display: 'inline-flex', alignItems: 'center', gap: 6 }, children: [i > 1 && _jsx("span", { style: S.op, children: "\u3068" }), _jsxs("span", { style: { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }, children: [box(`com.n${i}`, `${i}つめの分数の分子`, 50), _jsx("span", { style: { width: 44, borderTop: '2.5px solid #0f2540' } }), box(`com.d${i}`, `${i}つめの分数の分母`, 50)] })] }, i))), nf < 3 && _jsx("button", { type: "button", style: S.ghost, onClick: () => setNf(3), children: "\u3082\u30461\u3064 \u3075\u3084\u3059" })] }), _jsxs("div", { style: S.row, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 900 }, children: "\u5171\u901A\u306E \u5206\u6BCD\u306F" }), box('com.L', '共通の分母', 60), _jsx("span", { style: { fontSize: 11, color: '#8496ad', fontWeight: 700 }, children: "\uFF08\u5206\u6BCD\u306E \u516C\u500D\u6570\u3002\u307E\u305A\u300C\u500D\u6570\u3092 \u306A\u3089\u3079\u308B\u300D\u3067 \u898B\u3064\u3051\u3066\u3082\u3044\u3044\u3088\uFF09" })] }), !L && okRows.length > 0 && _jsx("p", { style: { ...S.label, marginTop: 10 }, children: "\u5171\u901A\u306E \u5206\u6BCD\u3092 \u5165\u308C\u308B\u3068\u3001\u300C\u00D7\u300D\u306E \u77E2\u5370\u304C \u51FA\u308B\u3088\u3002" }), L && okRows.map((i) => {
                    const n = toInt(val(`com.n${i}`));
                    const d = toInt(val(`com.d${i}`));
                    const k = scaleFactor(d, L);
                    return (_jsxs("div", { style: { ...S.row, gap: 8 }, children: [_jsx(Fr, { n: n, d: d }), k ? (_jsxs(_Fragment, { children: [_jsx(Arrow, { label: `×${k}` }), _jsxs("span", { style: { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }, children: [box(`com.x${i}`, `${i}つめの分数の通分後の分子`, 56), _jsx("span", { style: { width: 52, borderTop: '2.5px solid #0f2540' } }), _jsx("span", { style: { fontSize: 21, fontWeight: 900 }, children: L })] }), _jsxs("span", { style: { fontSize: 11, color: RED, fontWeight: 800 }, children: ["\u5206\u6BCD\u306B \u00D7", k, "\u3002\u5206\u5B50\u306B\u3082 \u00D7", k, " \u3060\u3088"] })] })) : (_jsxs("span", { style: { fontSize: 12, color: RED, fontWeight: 800 }, children: [L, " \u306F ", d, " \u306E \u500D\u6570\u3058\u3083\u306A\u3044\u3088\u3002", d, " \u3092 ", L, " \u306B\u306F \u3067\u304D\u306A\u3044\u306D\u3002"] }))] }, i));
                }), L && okRows.length >= 2 && (_jsxs("div", { style: { ...S.row, borderTop: '1px dashed #bcd3ec', paddingTop: 10 }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 900 }, children: "\u5206\u5B50\u3092" }), _jsx("button", { type: "button", "aria-label": "\u305F\u3059\u30FB\u3072\u304F\u3092 \u304B\u3048\u308B", onClick: () => setComOp((o) => (o === '+' ? '-' : '+')), style: S.tool(), children: comOp === '+' ? 'たす ＋' : 'ひく －' }), _jsxs("span", { style: { fontSize: 20, fontWeight: 900 }, children: [okRows.map((i, j) => (_jsxs("span", { children: [j > 0 && (comOp === '+' ? ' ＋ ' : ' － '), xs[i - 1] ?? '□'] }, i))), ' ＝ '] }), box('com.s', '分子の答え', 56), toInt0(val('com.s')) !== null && _jsxs("span", { style: { display: 'inline-flex', alignItems: 'center', gap: 6 }, children: [_jsx("span", { style: S.op, children: "\u2192" }), _jsx(Fr, { n: val('com.s'), d: L })] })] })), msg && _jsx("p", { style: S.msg, children: msg }), _jsx("p", { style: S.note, children: "\u5206\u6BCD\u306B \u304B\u3051\u305F \u6570\u3092\u3001\u5206\u5B50\u306B\u3082 \u304B\u3051\u308B\u3088\uFF08\u5927\u304D\u3055\u306F \u304B\u308F\u3089\u306A\u3044\uFF09\u3002\u300C\u305F\u3059\u30FB\u3072\u304F\u300D\u306E \u3068\u3053\u308D\u306F \u5206\u6BCD\u306F \u305D\u306E\u307E\u307E\u3067 \u5206\u5B50\u3060\u3051 \u8A08\u7B97\u3059\u308B\u3088\u3002" })] }));
    };
    /* ---------- 約分 ---------- */
    const renderReduce = () => {
        const n = toInt(val('red.n'));
        const d = toInt(val('red.d'));
        const stages = n && d ? reduceChain(n, d, gs).stages : [];
        const last = stages[stages.length - 1];
        const apply = (g) => {
            if (!last) {
                setMsg('分数を 入れてね。');
                return;
            }
            const r = applyDivisor(last.n, last.d, g);
            if (!r.ok) {
                setMsg(r.reason);
                return;
            }
            setMsg(null);
            setGs((x) => [...x, g]);
        };
        const g = toInt(val('red.g'));
        return (_jsxs(_Fragment, { children: [_jsx("p", { style: S.label, children: "\u7D04\u5206\u3057\u305F\u3044 \u5206\u6570\u3092 \u5165\u308C\u3066\u306D\u3002" }), _jsxs("span", { style: { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }, children: [box('red.n', '分子', 56), _jsx("span", { style: { width: 52, borderTop: '2.5px solid #0f2540' } }), box('red.d', '分母', 56)] }), last && (_jsxs(_Fragment, { children: [_jsx("div", { style: { ...S.row, gap: 10 }, children: stages.map((s, i) => (_jsxs("span", { style: { display: 'inline-flex', alignItems: 'center', gap: 10 }, children: [i > 0 && _jsx(Arrow, { label: `÷${s.g}` }), i < stages.length - 1 ? _jsx(Struck, { children: _jsx(Fr, { n: s.n, d: s.d }) }) : _jsx(Fr, { n: s.n, d: s.d })] }, i))) }), _jsx("p", { style: { ...S.label, marginTop: 12 }, children: "\u5206\u5B50\u3068 \u5206\u6BCD\u3092 \u3069\u3061\u3089\u3082 \u308F\u308B \u6570\u3092 \u3048\u3089\u307C\u3046\uFF08\u308F\u308C\u306A\u3051\u308C\u3070 \u7406\u7531\u304C \u51FA\u308B\u3088\uFF09" }), _jsxs("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }, children: [[2, 3, 5, 7].map((c) => (_jsxs("button", { type: "button", "aria-label": `${c}でわる`, style: S.tool(), onClick: () => apply(c), children: ["\u00F7", c] }, c))), _jsx("span", { style: { fontSize: 14, fontWeight: 900, marginLeft: 6 }, children: "\u00F7" }), box('red.g', 'わる数', 52), _jsx("button", { type: "button", "aria-label": "\u3053\u306E\u6570\u3067\u308F\u308B", style: S.tool(), onClick: () => { if (g) {
                                        apply(g);
                                        setFields((f) => ({ ...f, 'red.g': '' }));
                                    }
                                    else
                                        setMsg('わる 数を 入れてね。'); }, children: "\u308F\u308B" }), gs.length > 0 && _jsx("button", { type: "button", style: S.ghost, onClick: () => { setGs((x) => x.slice(0, -1)); setMsg(null); }, children: "\u3072\u3068\u3064 \u3082\u3069\u3059" })] })] })), msg && _jsx("p", { style: S.msg, children: msg }), _jsx("p", { style: S.note, children: "\u7D04\u5206\u306F\u3001\u5206\u5B50\u3068 \u5206\u6BCD\u3092 \u540C\u3058\u6570\u3067 \u308F\u308B\u3053\u3068\u3002\u3082\u3046 \u308F\u308C\u306A\u304F \u306A\u308B\u307E\u3067 \u3064\u3065\u3051\u3088\u3046\u3002\u6570\u304C \u5927\u304D\u3044\u3068\u304D\u306F\u3001\u5927\u304D\u3044 \u6570\u3067 \u308F\u308B\u3068 1\u56DE\u3067 \u3059\u3080\u3088\u3002" })] }));
    };
    /* ---------- 仮分数・帯分数 ---------- */
    const renderConvert = () => {
        const w = toInt0(val('cv.w'));
        const n = toInt0(val('cv.n'));
        const d = toInt(val('cv.d'));
        const modeBtns = (_jsxs("div", { style: { display: 'flex', gap: 6, marginBottom: 10 }, children: [_jsx("button", { type: "button", style: S.tab(cvMode === 'toMixed'), onClick: () => { setCvMode('toMixed'); setActive(null); }, children: "\u4EEE\u5206\u6570 \u2192 \u5E2F\u5206\u6570" }), _jsx("button", { type: "button", style: S.tab(cvMode === 'toImproper'), onClick: () => { setCvMode('toImproper'); setActive(null); }, children: "\u5E2F\u5206\u6570 \u2192 \u4EEE\u5206\u6570" })] }));
        const input = (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [box('cv.w', '整数（なければ空）', 50), _jsxs("span", { style: { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }, children: [box('cv.n', '分子', 50), _jsx("span", { style: { width: 44, borderTop: '2.5px solid #0f2540' } }), box('cv.d', '分母', 50)] }), _jsx("span", { style: { fontSize: 11, color: '#8496ad', fontWeight: 700 }, children: "\u6574\u6570\u304C \u306A\u3044\u3068\u304D\u306F \u7A7A\u306B \u3057\u3066 \u304A\u3053\u3046" })] }));
        if (cvMode === 'toMixed') {
            const q = toInt0(val('cv.q'));
            const r = toInt0(val('cv.r'));
            const improper = n !== null && d !== null && n >= d;
            return (_jsxs(_Fragment, { children: [modeBtns, input, n !== null && d !== null && !improper && _jsx("p", { style: { ...S.label, marginTop: 10 }, children: "\u5206\u5B50\u304C \u5206\u6BCD\u3088\u308A \u5C0F\u3055\u3044\u304B\u3089\u3001\u3053\u306E\u307E\u307E\u3067 \u5E2F\u5206\u6570\u306B \u3059\u308B \u3068\u3053\u308D\u306F \u306A\u3044\u3088\u3002" }), improper && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { ...S.row, gap: 8 }, children: [_jsxs("span", { style: { fontSize: 20, fontWeight: 900 }, children: [n, " \u00F7 ", d, " \uFF1D"] }), box('cv.q', '商', 50), _jsx("span", { style: { fontSize: 15, fontWeight: 900 }, children: "\u3042\u307E\u308A" }), box('cv.r', 'あまり', 50)] }), q !== null && r !== null && (_jsxs("p", { style: { ...S.label, marginTop: 8 }, children: ["\u305F\u3057\u304B\u3081: ", d, " \u00D7 ", q, " \uFF0B ", r, " \uFF1D ", divCheck(d, q, r), "\uFF08", n, " \u306B \u306A\u308B\u304B\u306A\uFF1F\uFF09"] })), q !== null && r !== null && (_jsxs("div", { style: { ...S.row, gap: 8 }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 900 }, children: "\u5E2F\u5206\u6570\u306B \u3059\u308B\u3068" }), r === 0 ? _jsx("span", { style: { fontSize: 22, fontWeight: 900 }, children: (w ?? 0) + q }) : _jsx(Fr, { w: (w ?? 0) + q > 0 ? (w ?? 0) + q : undefined, n: r, d: d }), w !== null && w > 0 && _jsxs("span", { style: { fontSize: 11, color: RED, fontWeight: 800 }, children: ["\u6574\u6570 ", w, " \u306B \u5546 ", q, " \u3092 \u304F\u308A\u4E0A\u3052\u305F\u3088"] })] }))] }))] }));
        }
        const x = toInt0(val('cv.x'));
        return (_jsxs(_Fragment, { children: [modeBtns, input, n !== null && d !== null && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { ...S.row, gap: 8 }, children: [_jsxs("span", { style: { fontSize: 20, fontWeight: 900 }, children: [d, " \u00D7 ", w ?? 0, " \uFF0B ", n, " \uFF1D"] }), box('cv.x', '仮分数の分子', 56)] }), x !== null && (_jsxs("div", { style: { ...S.row, gap: 8 }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 900 }, children: "\u4EEE\u5206\u6570\u306B \u3059\u308B\u3068" }), _jsx(Fr, { n: x, d: d })] }))] }))] }));
    };
    /* ---------- くり下げ ---------- */
    const renderBorrow = () => {
        const w = toInt0(val('bo.w'));
        const n = toInt0(val('bo.n')) ?? 0;
        const d = toInt(val('bo.d'));
        const wholeOnly = n === 0;
        const doBorrow = () => {
            if (w === null || w < 1) {
                setMsg('整数が 1以上の ときに くり下げられるよ。');
                return;
            }
            if (!d) {
                setMsg('分母を 入れてね。整数だけの ときは、使いたい 分母を 自分で きめて 入れよう。');
                return;
            }
            setMsg(null);
            setBorrowed(true);
        };
        const res = w !== null && d ? borrowOne({ w, n, d }) : null;
        const a = toInt0(val('bo.a'));
        const b = toInt0(val('bo.b'));
        return (_jsxs(_Fragment, { children: [_jsx("p", { style: S.label, children: "\u3072\u304B\u308C\u308B \u6570\u3092 \u5165\u308C\u3066\u306D\u3002\uFF08\u6574\u6570\u3060\u3051 \u306A\u3089 \u5206\u5B50\u306F \u7A7A\u3067\u3001\u5206\u6BCD\u306F \u81EA\u5206\u3067 \u304D\u3081\u3066 \u5165\u308C\u308B\uFF09" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [box('bo.w', '整数', 50), _jsxs("span", { style: { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }, children: [box('bo.n', '分子', 50), _jsx("span", { style: { width: 44, borderTop: '2.5px solid #0f2540' } }), box('bo.d', '分母', 50)] }), _jsx("button", { type: "button", style: S.tool(borrowed), onClick: () => (borrowed ? setBorrowed(false) : doBorrow()), children: borrowed ? 'もとに もどす' : '1 くり下げる' })] }), borrowed && res && w !== null && d && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { ...S.row, gap: 14, marginTop: 24 }, children: [_jsxs("span", { style: { display: 'inline-flex', alignItems: 'center', gap: 8 }, children: [_jsx(Struck, { now: res.w, children: _jsx("span", { style: { fontSize: 24, fontWeight: 900 }, children: w }) }), !wholeOnly && (_jsx(Struck, { now: `${res.n}/${d}`, children: _jsx(Fr, { n: n, d: d }) })), wholeOnly && _jsxs("span", { style: { fontSize: 22, fontWeight: 900, color: RED }, children: ["\uFF0B ", _jsx(Fr, { n: d, d: d, color: RED })] })] }), _jsx("span", { style: S.op, children: "\u2192" }), _jsx(Fr, { w: res.w > 0 ? res.w : undefined, n: res.n, d: d })] }), _jsxs("p", { style: { ...S.label, marginTop: 10 }, children: [w, " \u304B\u3089 1 \u304F\u308A\u4E0B\u3052\u3066 ", res.w, "\u3002\u305D\u306E 1 \u306F ", Fr_text(d, d), " \u3060\u304B\u3089\u3001", wholeOnly ? `${d}/${d}` : `${n}/${d} に ${d}/${d} を たして ${res.n}/${d}`, "\u3002"] }), _jsxs("div", { style: { ...S.row, gap: 8 }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 900 }, children: "\u3072\u304D\u7B97\u306E \u7B54\u3048  \u5206\u6570\u306E \u3068\u3053\u308D\uFF08\u5206\u5B50\uFF09" }), box('bo.a', '分子の答え', 56), _jsx("span", { style: { fontSize: 13, fontWeight: 900 }, children: "\u6574\u6570\u306E \u3068\u3053\u308D" }), box('bo.b', '整数の答え', 50)] }), a !== null && b !== null && (_jsxs("div", { style: { ...S.row, gap: 8 }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 900 }, children: "\u66F8\u304F\u3068" }), _jsx(Fr, { w: b > 0 ? b : undefined, n: a, d: d }), _jsx("span", { style: { fontSize: 11, color: '#8496ad', fontWeight: 700 }, children: "\uFF08\u7D04\u5206\u3067\u304D\u308B\u304B \u898B\u3088\u3046\u3002\u300C\u7D04\u5206\u300D\u306E \u9053\u5177\u304C \u3064\u304B\u3048\u308B\u3088\uFF09" })] }))] })), msg && _jsx("p", { style: S.msg, children: msg }), _jsxs("p", { style: S.note, children: ["\u5206\u6570\u306E \u3068\u3053\u308D\u304C \u3072\u3051\u306A\u3044 \u3068\u304D\u306F\u3001\u6574\u6570\u304B\u3089 1 \u304F\u308A\u4E0B\u3052\u3066\u3001\u305D\u306E 1 \u3092 \u5206\u6BCD\u3068 \u540C\u3058\u6570\u306E \u5206\u6570\uFF08", Fr_text(3, 3), "\u306A\u3069\uFF09\u306B \u3057\u3066 \u5206\u6570\u306B \u305F\u3059\u3088\u3002"] })] }));
    };
    return (_jsxs("div", { style: S.wrap, children: [_jsxs("div", { style: S.head, children: [_jsx("p", { style: S.title, children: "\u5206\u6570\u306E \u3051\u3044\u3055\u3093\u3089\u3093\uFF08\u3058\u3086\u3046\u306B \u3064\u304B\u3063\u3066\u3044\u3044\u3088\uFF09" }), _jsx("span", { style: { marginLeft: 'auto' }, children: _jsx("button", { type: "button", onClick: clearTool, style: S.ghost, children: "\u305C\u3093\u3076 \u3051\u3059" }) })] }), list.length > 1 && (_jsx("div", { style: { display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }, children: list.map((t) => (_jsx("button", { type: "button", onClick: () => { setTool(t); setActive(null); setMsg(null); }, style: S.tab(tool === t), children: TOOL_LABEL[t] }, t))) })), tool === 'multiples' && renderMultiples(), tool === 'common' && renderCommon(), tool === 'reduce' && renderReduce(), tool === 'convert' && renderConvert(), tool === 'borrow' && renderBorrow(), _jsxs("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 14 }, children: [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((c) => (_jsx("button", { type: "button", onClick: () => put(c), style: S.key, children: c }, c))), _jsx("button", { type: "button", "aria-label": "\u3064\u304E\u306E\u7BB1\u3078", onClick: next, style: S.key, children: "\u3064\u304E \u25B6" }), _jsx("button", { type: "button", "aria-label": "1\u6587\u5B57\u3051\u3059", onClick: back, style: { ...S.key, color: RED }, children: "\u2190" })] }), _jsx("p", { style: S.note, children: "\u3053\u3053\u306F \u7B54\u3048\u5408\u308F\u305B\u3092 \u3057\u306A\u3044\u3088\u3002\u7B54\u3048\u306F \u4E0A\u306E \u3089\u3093\u306B \u5165\u308C\u3066\u306D\u3002" })] }));
}
/** 文章の 中に 書く 分数（n/d）。縦書きは 使わない（小さい 説明文用） */
function Fr_text(n, d) {
    return `${n}/${d}`;
}
/**
 * ボタンを押したときだけ開く「分数のけいさんらん」。
 * **はじめは閉じておく。** 簡単な設問では要らないので、いつも開いていると画面が煩雑になる。
 */
export function FractionPadToggle(props) {
    const { label = '分数の けいさんらんを つかう', ...rest } = props;
    const [open, setOpen] = useState(false);
    return (_jsxs("div", { style: { textAlign: 'center' }, children: [_jsxs("button", { type: "button", onClick: () => setOpen((v) => !v), style: {
                    border: 0, borderRadius: 999, cursor: 'pointer',
                    background: '#e0f2fe', color: '#0369a1', fontWeight: 900, fontSize: 13,
                    padding: '8px 16px', fontFamily: FONT,
                }, children: ["\uD83D\uDCDD ", open ? 'けいさんらんを とじる' : label] }), open && _jsx(FractionPad, { ...rest })] }));
}
//# sourceMappingURL=FractionPad.js.map