import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * けいさんらん — 紙に書くかわりに、アプリの中で筆算をするための場所。
 *
 * 文章題・たしかめ算・縮尺の計算など、**答えの入力そのものは別のUIなのに、
 * その裏で暗算では厳しい計算を要求している**設問は、どの単元にもある。
 * 専用の計算欄が無いと、児童はアプリの外（紙）で計算してから答えを入力する
 * ことになり、「アプリの中で完結する」体験が崩れる
 * （master-DB: patterns/scratch-calculation-corner-for-hard-arithmetic.md）。
 *
 * 使い方は紙の筆算と同じ2だん階:
 *   1. 立式 … 2つの数を打つ。「筆算にする」で、位のそろった（空いたマスの無い）筆算になる
 *   2. 計算 … 答えの段に書く。
 *        - 2けた入れると 十の位が くり上がりとして 左のマスに小さく出る（マスターモードと同じ）
 *        - ひき算は 上の数の数字を おすと 左から 10 かりる（斜線と小さい数字）。
 *          0 が続くときは つながって かりる。もう一度おすと もどる
 *        - わり算は 商・かける・ひく の段。ひく段でも「10を かりる」が使える
 *
 * **採点はしない。** 答え合わせは元の問題側の入力UIでする。ここに○×を持たせると、
 * そちらの判定と食いちがって児童が混乱する。ここは書き込みスペースに徹する。
 *
 * **数は子どもが自分で入れる。** 問題の数を入れておくと、文章題では
 * 「何と何をどう計算するか」という、その問題がいちばん問うているところを
 * 先に答えてしまう。式を立てるのは子どもの仕事として残す。
 * （たしかめ算のように、数が問題文にそのまま書いてある場面だけ `initial` で渡してよい）
 *
 * **保存も送信もしない。** 画面の中だけで動くので、記録やサーバの負荷は増えない。
 *
 * 見た目はインラインスタイルで自己完結させる。単元アプリはそれぞれ別のテーマ
 * （マトリックス・桜吹雪など暗い配色もある）を持っていて、クラス名に頼ると
 * どれかのアプリで文字が背景に沈む。
 */
import { useMemo, useState } from 'react';
import { buildLayout, applyBorrows, toggleBorrow, rowValues, typeDigit, carryOf, commonZeros, DIV_STEPS_MAX, } from './scratchLayout.js';
const OPS = [
    { op: '+', label: 'たし算' },
    { op: '-', label: 'ひき算' },
    { op: '×', label: 'かけ算' },
    { op: '÷', label: 'わり算' },
];
/** 1つの数に入れられる けた数（小数点をのぞく） */
const NUM_MAX = 7;
/** わる数は 4けたまで（小4: 3けた÷3けた、小5: 12.5 などの小数） */
const DIVISOR_MAX = 4;
/** わり進むときに つけたせる 0 の数 */
const EXTRA_ZERO_MAX = 4;
/** 画面に出す記号（ハイフンではなく 全角の − を使う） */
const SIGN = { '+': '+', '-': '−', '×': '×', '÷': '÷' };
const CW = 34;
const CH = 40;
const INK = '#0f2540';
const RED = '#e11d48';
const AMBER = '#b45309';
const FONT = 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
const S = {
    wrap: {
        borderRadius: 18, border: '2px dashed #bcd3ec', background: '#f7fbff',
        padding: 14, marginTop: 10, marginBottom: 10, fontFamily: FONT, color: INK, textAlign: 'left',
    },
    head: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
    title: { fontSize: 12, fontWeight: 800, color: '#2f4d75', margin: 0 },
    opBtn: (on) => ({
        border: 0, borderRadius: 10, cursor: 'pointer', fontWeight: 900, fontSize: 15,
        padding: '6px 12px', background: on ? '#0ea5e9' : '#e8eff8', color: on ? '#fff' : '#54637a',
    }),
    /** 立式の数を入れる箱 */
    field: (on) => ({
        minWidth: 96, height: 46, padding: '0 10px', borderRadius: 10, cursor: 'pointer',
        display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 900, color: INK,
        background: on ? '#e0f2fe' : '#fff', border: on ? '2px solid #0ea5e9' : '1px solid #cfdcec',
        boxSizing: 'border-box', letterSpacing: 1,
    }),
    /**
     * 書きこむマス。**空でも枠が見えるようにする。**
     * 枠を透明にすると、子どもには「どこに書けるのか」が分からない。
     */
    cell: (on) => ({
        position: 'relative', width: CW - 2, height: CH, margin: '0 1px', fontSize: 22, fontWeight: 800,
        display: 'grid', placeItems: 'center', cursor: 'pointer', userSelect: 'none',
        background: on ? '#e0f2fe' : '#fff', border: on ? '2px solid #0ea5e9' : '1px solid #dbe6f3',
        borderRadius: 5, boxSizing: 'border-box', color: INK,
    }),
    /** 問題の数（書きかえない）。枠は付けず、紙に印刷された数字のように見せる */
    fixed: {
        position: 'relative', width: CW, height: CH, fontSize: 24, fontWeight: 800,
        display: 'grid', placeItems: 'center', userSelect: 'none', color: INK,
    },
    key: {
        minWidth: 42, height: 40, borderRadius: 8, border: '1px solid #cfdcec', background: '#f2f7fd',
        fontSize: 17, fontWeight: 800, color: '#2f4d75', cursor: 'pointer', padding: '0 8px',
    },
    ghost: {
        border: '1px solid #dbe4f0', borderRadius: 10, background: '#fff',
        color: '#64748b', fontWeight: 800, fontSize: 12, padding: '6px 12px', cursor: 'pointer',
    },
    tool: (on = false) => ({
        border: on ? `2px solid ${RED}` : '1px solid #dbe4f0', borderRadius: 10,
        background: on ? '#fff1f2' : '#fff', color: on ? RED : '#475569',
        fontWeight: 800, fontSize: 12, padding: '6px 10px', cursor: 'pointer',
    }),
    primary: {
        border: 0, borderRadius: 12, background: '#0ea5e9', color: '#fff', fontWeight: 900,
        fontSize: 15, padding: '10px 18px', cursor: 'pointer',
    },
    note: { fontSize: 11, color: '#8496ad', marginTop: 10, marginBottom: 0, lineHeight: 1.7 },
    msg: { fontSize: 12, color: RED, fontWeight: 800, margin: '8px 0 0', textAlign: 'center' },
};
/** 斜線を引いた数字。now があれば、上に小さく新しい数を書く（10 かりたあと） */
function Struck({ digit, now, faint }) {
    return (_jsxs(_Fragment, { children: [now !== undefined && (_jsx("span", { style: {
                    position: 'absolute', top: -13, left: 0, right: 0, textAlign: 'center',
                    fontSize: 13, fontWeight: 900, color: RED,
                }, children: now })), _jsxs("span", { style: { position: 'relative', color: faint ? '#b6c3d4' : '#94a3b8' }, children: [digit, _jsx("span", { style: {
                            position: 'absolute', left: '-25%', top: '50%', width: '150%', height: 2.5, background: RED,
                            transform: 'rotate(-28deg)', borderRadius: 2,
                        } })] })] }));
}
function Point() {
    return (_jsx("span", { style: { position: 'absolute', right: -5, bottom: 2, fontSize: 24, fontWeight: 900, color: INK, lineHeight: 1 }, children: "." }));
}
export function ScratchPad({ defaultOp, ops = ['+', '-', '×', '÷'], decimal = true, initial, }) {
    const [op, setOp] = useState(initial?.op ?? defaultOp ?? ops[0] ?? '÷');
    const [a, setA] = useState(initial?.a ?? '');
    const [b, setB] = useState(initial?.b ?? '');
    const [field, setField] = useState('a');
    const [stage, setStage] = useState(initial ? 'work' : 'setup');
    const [msg, setMsg] = useState(null);
    // 計算の段
    const [cells, setCells] = useState({});
    const [points, setPoints] = useState({});
    const [borrows, setBorrows] = useState({});
    const [sel, setSel] = useState(null);
    const [borrowMode, setBorrowMode] = useState(false);
    // わり算だけの道具
    const [extraZeros, setExtraZeros] = useState(0);
    const [divSteps, setDivSteps] = useState(undefined);
    const [struck, setStruck] = useState(0);
    const zerosCanStrike = op === '÷' ? commonZeros(a, b) : 0;
    const effA = struck ? a.slice(0, -struck) : a;
    const effB = struck ? b.slice(0, -struck) : b;
    const built = useMemo(() => buildLayout({ op, a: effA, b: effB, extraZeros, divSteps }), [op, effA, effB, extraZeros, divSteps]);
    const layout = built.ok ? built.layout : null;
    const resetWork = () => {
        setCells({});
        setPoints({});
        setBorrows({});
        setSel(null);
        setBorrowMode(false);
        setMsg(null);
    };
    /* ---------- 立式 ---------- */
    const setupPut = (v) => {
        const cur = field === 'a' ? a : b;
        const limit = op === '÷' && field === 'b' ? DIVISOR_MAX : NUM_MAX;
        if (v === '.') {
            if (!decimal || cur.includes('.') || cur === '')
                return;
        }
        else if (cur.replace('.', '').length >= limit)
            return;
        (field === 'a' ? setA : setB)(cur + v);
        setMsg(null);
    };
    const setupBack = () => (field === 'a' ? setA : setB)((s) => s.slice(0, -1));
    const toWork = () => {
        const r = buildLayout({ op, a, b });
        if (!r.ok) {
            setMsg(r.reason);
            return;
        }
        resetWork();
        setExtraZeros(0);
        setDivSteps(undefined);
        setStruck(0);
        setStage('work');
    };
    /* ---------- 計算 ---------- */
    const rowsById = useMemo(() => {
        const m = new Map();
        if (!layout)
            return m;
        if (layout.kind === 'column') {
            for (const r of layout.partials)
                m.set(r.id, r);
            m.set(layout.answer.id, layout.answer);
        }
        else {
            m.set(layout.quotient.id, layout.quotient);
            for (const s of layout.steps) {
                m.set(s.product.id, s.product);
                m.set(s.diff.id, s.diff);
            }
        }
        return m;
    }, [layout]);
    const width = layout?.width ?? 0;
    const bufOf = (id) => {
        const arr = cells[id] ?? [];
        return Array.from({ length: width }, (_, i) => arr[i] ?? '');
    };
    /** いちばん左のマスは 左どなりが無いので、くり上がりの2けた目を入れない */
    const maxAt = (r, col) => (col === r.start ? 1 : r.max);
    const move = (d) => setSel((s) => {
        if (!s)
            return s;
        const r = rowsById.get(s.row);
        if (!r)
            return s;
        return { row: s.row, col: Math.min(r.end, Math.max(r.start, s.col + d)) };
    });
    const workPut = (v) => {
        if (!sel) {
            setMsg('書きたい マスを おしてね。');
            return;
        }
        const r = rowsById.get(sel.row);
        if (!r)
            return;
        if (v === '.') {
            if (!r.freePoint)
                return;
            setPoints((p) => ({ ...p, [r.id]: p[r.id] === sel.col ? null : sel.col }));
            return;
        }
        const buf = bufOf(r.id);
        const max = maxAt(r, sel.col);
        const next = typeDigit(buf[sel.col] ?? '', v, max);
        buf[sel.col] = next;
        setCells((c) => ({ ...c, [r.id]: buf }));
        setMsg(null);
        // 右から左へ書く段は、マスが いっぱいになったら 左へ進む（2けたのマスは 2けためで）。
        // 商は 左から右へ書くので 右へ進む
        if (r.id === 'q')
            move(1);
        else if (layout?.kind === 'column' && next.length >= max)
            move(-1);
    };
    const workBack = () => {
        if (!sel)
            return;
        const buf = bufOf(sel.row);
        buf[sel.col] = (buf[sel.col] ?? '').slice(0, -1);
        setCells((c) => ({ ...c, [sel.row]: buf }));
    };
    const clearAll = () => {
        if (stage === 'setup') {
            setA('');
            setB('');
            setField('a');
            setMsg(null);
            return;
        }
        resetWork();
    };
    /** 10 を かりる。base は その段の いまの数字 */
    const borrowAt = (rowKey, base, col) => {
        const cur = borrows[rowKey] ?? [];
        const next = toggleBorrow(base, cur, col);
        if (next.length === cur.length && !cur.includes(col)) {
            setMsg('左に かりられる 数字が ないよ。');
            return;
        }
        setMsg(null);
        setBorrows((m) => ({ ...m, [rowKey]: next }));
    };
    const tapCell = (r, col) => {
        if (borrowMode && r.borrowable) {
            borrowAt(r.id, rowValues(bufOf(r.id)), col);
            return;
        }
        setBorrowMode(false);
        setSel({ row: r.id, col });
        setMsg(null);
    };
    /* ---------- 描画 ---------- */
    const renderFixed = (row, borrowKey, extra) => {
        const base = row.cells.map((c) => (c ? Number(c.digit) : null));
        const view = borrowKey ? applyBorrows(base, borrows[borrowKey] ?? []) : null;
        return (_jsxs("div", { style: { display: 'flex' }, children: [row.cells.map((c, i) => {
                    const tappable = !!(borrowKey && c);
                    return (_jsxs("div", { onClick: tappable ? () => borrowAt(borrowKey, base, i) : undefined, style: { ...S.fixed, cursor: tappable ? 'pointer' : 'default' }, children: [c && (view?.changed[i]
                                ? _jsx(Struck, { digit: c.digit, now: view.values[i], faint: c.helper })
                                : _jsx("span", { style: { color: c.helper ? '#b6c3d4' : INK }, children: c.digit })), row.pointAfter === i && _jsx(Point, {})] }, i));
                }), extra] }));
    };
    const renderInput = (r) => {
        const buf = bufOf(r.id);
        const view = r.borrowable ? applyBorrows(rowValues(buf), borrows[r.id] ?? []) : null;
        const pt = r.freePoint ? points[r.id] ?? null : r.fixedPointAfter;
        return (_jsx("div", { style: {
                display: 'flex', paddingBottom: r.lineBelow ? 3 : 0,
                borderBottom: r.lineBelow ? `2px solid ${INK}` : 'none',
            }, children: Array.from({ length: width }, (_, col) => {
                if (col < r.start || col > r.end)
                    return _jsx("div", { style: { width: CW, height: CH } }, col);
                const v = buf[col] ?? '';
                const main = v.slice(-1);
                const carry = col < r.end ? carryOf(buf[col + 1] ?? '') : null;
                const on = sel?.row === r.id && sel.col === col;
                return (_jsxs("div", { onClick: () => tapCell(r, col), style: S.cell(on), children: [carry && (_jsx("span", { style: {
                                position: 'absolute', top: -8, right: -4, fontSize: 11, fontWeight: 900, color: AMBER,
                                background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 4, padding: '0 3px',
                                lineHeight: 1.3, zIndex: 1,
                            }, children: carry })), view?.changed[col] && main !== '' ? _jsx(Struck, { digit: main, now: view.values[col] }) : main, pt === col && _jsx(Point, {})] }, col));
            }) }));
    };
    const signCol = (s) => (_jsx("span", { style: { width: 26, fontSize: 20, fontWeight: 800, color: '#7c8da6', textAlign: 'center', flexShrink: 0 }, children: s }));
    const gap = { marginTop: 12 };
    const renderColumn = (l) => (_jsxs("div", { style: { display: 'inline-block' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', ...gap }, children: [signCol(''), renderFixed(l.top, l.borrowTop ? 'top' : null)] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', ...gap }, children: [signCol(SIGN[op]), _jsx("div", { style: { borderBottom: `3px solid ${INK}`, paddingBottom: 2 }, children: renderFixed(l.bottom, null) })] }), l.partials.map((r, i) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', ...gap }, children: [signCol(''), _jsx("div", { style: i === l.partials.length - 1 ? { borderBottom: `3px solid ${INK}`, paddingBottom: 3 } : undefined, children: renderInput(r) })] }, r.id))), _jsxs("div", { style: { display: 'flex', alignItems: 'center', ...gap }, children: [signCol(''), renderInput(l.answer)] })] }));
    const renderDivision = (l) => {
        const divW = Math.max(52, (l.divisor.length + struck) * 15 + 18);
        const pad = _jsx("div", { style: { width: divW, flexShrink: 0 } });
        // 0を消す くふうで消した0は、わられる数の右に 斜線つきで残す（消したことが見えるように）
        const struckZeros = struck > 0 && (_jsx("span", { style: { display: 'flex' }, children: Array.from({ length: struck }, (_, i) => (_jsx("span", { style: { ...S.fixed, width: CW - 6 }, children: _jsx(Struck, { digit: "0" }) }, i))) }));
        return (_jsxs("div", { style: { display: 'inline-block' }, children: [_jsxs("div", { style: { display: 'flex', ...gap }, children: [pad, renderInput(l.quotient)] }), _jsxs("div", { style: { display: 'flex', alignItems: 'stretch', marginTop: 4 }, children: [_jsxs("div", { style: {
                                width: divW, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                paddingRight: 6, boxSizing: 'border-box', fontSize: 24, fontWeight: 800,
                                borderRight: `3px solid ${INK}`, borderTopRightRadius: 12,
                            }, children: [l.divisor, Array.from({ length: struck }, (_, i) => (_jsx("span", { style: { position: 'relative', marginLeft: 1, display: 'inline-grid', placeItems: 'center' }, children: _jsx(Struck, { digit: "0" }) }, i)))] }), _jsx("div", { style: { borderTop: `3px solid ${INK}`, paddingTop: 10 }, children: renderFixed(l.dividend, 'dividend', struckZeros) })] }), l.steps.map((s) => (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', ...gap }, children: [pad, renderInput(s.product)] }), _jsxs("div", { style: { display: 'flex', ...gap }, children: [pad, renderInput(s.diff)] })] }, s.product.id)))] }));
    };
    const help = {
        '+': 'たてに たして、2けたに なったら そのまま 2つ 入れてね。くり上がりが 左に 小さく出るよ。',
        '-': 'ひけないときは、上の数の 数字を おしてね。左から 10 かりるよ（もう一度 おすと もどる）。',
        '×': '2けたを 入れると、くり上がりが 左に 小さく出るよ。答えの 小数点は「.」で 打てるよ。',
        '÷': 'いちばん上が 商。かけた数を 書いたら、その下で ひこう。ひけないときは「10を かりる」を おしてから 数字を おしてね。',
    };
    return (_jsxs("div", { style: S.wrap, children: [_jsxs("div", { style: S.head, children: [_jsxs("p", { style: S.title, children: ["\u3051\u3044\u3055\u3093\u3089\u3093\uFF08\u3058\u3086\u3046\u306B \u3064\u304B\u3063\u3066\u3044\u3044\u3088\uFF09", stage === 'work' && (_jsxs("span", { style: { fontWeight: 900, color: INK, marginLeft: 8, fontSize: 14 }, children: [a, " ", SIGN[op], " ", b] }))] }), _jsxs("span", { style: { marginLeft: 'auto', display: 'flex', gap: 6 }, children: [stage === 'work' && (_jsx("button", { type: "button", onClick: () => { resetWork(); setStage('setup'); }, style: S.ghost, children: "\u5F0F\u3092 \u306A\u304A\u3059" })), _jsx("button", { type: "button", onClick: clearAll, style: S.ghost, children: "\u305C\u3093\u3076 \u3051\u3059" })] })] }), stage === 'setup' ? (_jsxs(_Fragment, { children: [ops.length > 1 && (_jsx("div", { style: { display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }, children: OPS.filter((o) => ops.includes(o.op)).map((o) => (_jsxs("button", { type: "button", onClick: () => { setOp(o.op); setMsg(null); }, style: S.opBtn(op === o.op), children: [SIGN[o.op], " ", o.label] }, o.op))) })), _jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { role: "button", "aria-label": "1\u3064\u3081\u306E\u6570", onClick: () => setField('a'), style: S.field(field === 'a'), children: a || ' ' }), _jsx("span", { style: { fontSize: 11, color: '#8496ad', fontWeight: 700 }, children: op === '÷' ? 'わられる数' : '上の数' })] }), _jsx("span", { style: { fontSize: 26, fontWeight: 900, color: '#7c8da6', lineHeight: '46px' }, children: SIGN[op] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { role: "button", "aria-label": "2\u3064\u3081\u306E\u6570", onClick: () => setField('b'), style: S.field(field === 'b'), children: b || ' ' }), _jsx("span", { style: { fontSize: 11, color: '#8496ad', fontWeight: 700 }, children: op === '÷' ? 'わる数' : '下の数' })] })] }), _jsx(Keys, { decimal: decimal, onDigit: setupPut, onBack: setupBack }), _jsx("div", { style: { textAlign: 'center', marginTop: 12 }, children: _jsx("button", { type: "button", onClick: toWork, style: S.primary, children: "\u7B46\u7B97\u306B\u3059\u308B" }) }), msg && _jsx("p", { style: S.msg, children: msg }), _jsx("p", { style: S.note, children: "\u6570\u3092 \u5165\u308C\u3066\u300C\u7B46\u7B97\u306B\u3059\u308B\u300D\u3092 \u304A\u3059\u3068\u3001\u4F4D\u306E \u305D\u308D\u3063\u305F \u7B46\u7B97\u306B \u306A\u308B\u3088\u3002\u3053\u3053\u306F \u7B54\u3048\u5408\u308F\u305B\u3092 \u3057\u306A\u3044\u3088\u3002" })] })) : layout ? (_jsxs(_Fragment, { children: [layout.kind === 'division' && (_jsxs("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }, children: [_jsx("button", { type: "button", onClick: () => { setBorrowMode((v) => !v); setMsg(null); }, style: S.tool(borrowMode), children: borrowMode ? '10を かりる：オン' : '10を かりる' }), extraZeros < EXTRA_ZERO_MAX && struck === 0 && (_jsx("button", { type: "button", onClick: () => setExtraZeros((n) => n + 1), style: S.tool(), children: "0\u3092 \u3064\u3051\u305F\u3059\uFF08\u308F\u308A\u9032\u3080\uFF09" })), layout.steps.length < DIV_STEPS_MAX && (_jsx("button", { type: "button", onClick: () => setDivSteps(layout.steps.length + 1), style: S.tool(), children: "\u3060\u3093\u3092 \u3075\u3084\u3059" })), struck < zerosCanStrike && extraZeros === 0 && (_jsx("button", { type: "button", onClick: () => { setStruck((n) => n + 1); resetWork(); }, style: S.tool(), children: "0\u3092 \u6D88\u3059 \u304F\u3075\u3046" }))] })), _jsx("div", { style: { overflowX: 'auto', paddingBottom: 4 }, children: layout.kind === 'column' ? renderColumn(layout) : renderDivision(layout) }), _jsx(Keys, { decimal: decimal, onDigit: workPut, onBack: workBack, onMove: move }), msg && _jsx("p", { style: S.msg, children: msg }), _jsxs("p", { style: S.note, children: [help[op], " \u7B54\u3048\u306F \u4E0A\u306E \u3089\u3093\u306B \u5165\u308C\u3066\u306D\u3002"] })] })) : (_jsx("p", { style: S.msg, children: built.ok ? '' : built.reason }))] }));
}
/** けいさんらんのキー。答えの入力らんと見た目を変えて、取りちがえないようにする */
function Keys({ decimal, onDigit, onBack, onMove }) {
    return (_jsxs("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }, children: [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((n) => (_jsx("button", { type: "button", onClick: () => onDigit(n), style: S.key, children: n }, n))), decimal && _jsx("button", { type: "button", onClick: () => onDigit('.'), style: S.key, children: "." }), onMove && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", "aria-label": "\u5DE6\u306E\u30DE\u30B9\u3078", onClick: () => onMove(-1), style: S.key, children: "\u25C0" }), _jsx("button", { type: "button", "aria-label": "\u53F3\u306E\u30DE\u30B9\u3078", onClick: () => onMove(1), style: S.key, children: "\u25B6" })] })), _jsx("button", { type: "button", "aria-label": "1\u6587\u5B57\u3051\u3059", onClick: onBack, style: { ...S.key, color: RED }, children: "\u2190" })] }));
}
/**
 * ボタンを押したときだけ開く「けいさんらん」。
 *
 * **はじめは閉じておく。** 簡単な設問では要らないので、いつも開いていると
 * 画面が煩雑になり、本来の問題が下に押しやられる。
 */
export function ScratchPadToggle(props) {
    const { label = '筆算で けいさんする', ...rest } = props;
    const [open, setOpen] = useState(false);
    return (_jsxs("div", { style: { textAlign: 'center' }, children: [_jsxs("button", { type: "button", onClick: () => setOpen((v) => !v), style: {
                    border: 0, borderRadius: 999, cursor: 'pointer',
                    background: '#e0f2fe', color: '#0369a1', fontWeight: 900, fontSize: 13,
                    padding: '8px 16px', fontFamily: FONT,
                }, children: ["\uD83D\uDCDD ", open ? 'けいさんらんを とじる' : label] }), open && _jsx(ScratchPad, { ...rest })] }));
}
//# sourceMappingURL=ScratchPad.js.map