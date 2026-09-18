import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * けいさんらん — 紙に書くかわりに、アプリの中で筆算をするための場所。
 *
 * 文章題・たしかめ算・縮尺の計算など、**答えの入力そのものは別のUIなのに、
 * その裏で暗算では厳しい計算を要求している**設問は、どの単元にもある。
 * 専用の計算欄が無いと、児童はアプリの外（紙）で計算してから答えを入力する
 * ことになり、「アプリの中で完結する」体験が崩れる
 * （master-DB: patterns/scratch-calculation-corner-for-hard-arithmetic.md）。
 *
 * **採点はしない。** 答え合わせは元の問題側の入力UIでする。ここに○×を持たせると、
 * そちらの判定と食いちがって児童が混乱する。ここは書き込みスペースに徹する。
 *
 * **数は子どもが自分で入れる。** 問題の数を入れておくと、文章題では
 * 「何と何をどう計算するか」という、その問題がいちばん問うているところを
 * 先に答えてしまう。式を立てるのは子どもの仕事として残す。
 *
 * 見た目はインラインスタイルで自己完結させる。単元アプリはそれぞれ別のテーマ
 * （マトリックス・桜吹雪など暗い配色もある）を持っていて、クラス名に頼ると
 * どれかのアプリで文字が背景に沈む。
 */
import { useState } from 'react';
const OPS = [
    { op: '+', label: 'たし算' },
    { op: '-', label: 'ひき算' },
    { op: '×', label: 'かけ算' },
    { op: '÷', label: 'わり算' },
];
/** 1行ぶんのマス。右づめで書くので、配列の末尾が一の位側になる */
const COLS = 8;
const emptyRow = () => Array.from({ length: COLS }, () => '');
const S = {
    wrap: {
        borderRadius: 18, border: '1px solid #dbe4f0', background: '#fbfdff',
        padding: 14, marginTop: 10, marginBottom: 10,
        fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        color: '#0f2540',
    },
    head: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
    title: { fontSize: 12, fontWeight: 800, color: '#2f4d75', margin: 0 },
    opBtn: (on) => ({
        border: 0, borderRadius: 10, cursor: 'pointer', fontWeight: 900, fontSize: 15,
        padding: '6px 12px', background: on ? '#0ea5e9' : '#e8eff8', color: on ? '#fff' : '#54637a',
    }),
    cell: (on) => ({
        width: 34, height: 40, borderRadius: 8, fontSize: 20, fontWeight: 800,
        display: 'grid', placeItems: 'center', cursor: 'pointer', userSelect: 'none',
        background: on ? '#e0f2fe' : 'transparent',
        border: on ? '2px solid #0ea5e9' : '2px solid transparent',
        color: '#0f2540',
    }),
    key: {
        width: 52, height: 44, borderRadius: 10, border: '1px solid #dbe4f0', background: '#fff',
        fontSize: 18, fontWeight: 800, color: '#0f2540', cursor: 'pointer',
    },
    ghost: {
        border: '1px solid #dbe4f0', borderRadius: 10, background: '#fff',
        color: '#64748b', fontWeight: 800, fontSize: 12, padding: '6px 12px', cursor: 'pointer',
    },
};
export function ScratchPad({ defaultOp = '÷', ops = ['+', '-', '×', '÷'], decimal = true, rows = 6, }) {
    const [op, setOp] = useState(defaultOp);
    const [grid, setGrid] = useState(() => Array.from({ length: rows }, emptyRow));
    const [cur, setCur] = useState({ row: 0, col: COLS - 3 });
    const put = (v) => {
        setGrid((g) => {
            const next = g.map((r) => [...r]);
            next[cur.row][cur.col] = v;
            return next;
        });
        // 入れたら1つ右へ。右端まで来たら止まる（勝手に次の行へ行かない）
        setCur((c) => ({ row: c.row, col: Math.min(COLS - 1, c.col + 1) }));
    };
    const back = () => {
        setCur((c) => {
            const col = Math.max(0, c.col - 1);
            setGrid((g) => {
                const next = g.map((r) => [...r]);
                next[c.row][col] = '';
                return next;
            });
            return { row: c.row, col };
        });
    };
    const clear = () => {
        setGrid(Array.from({ length: rows }, emptyRow));
        setCur({ row: 0, col: COLS - 3 });
    };
    return (_jsxs("div", { style: S.wrap, children: [_jsxs("div", { style: S.head, children: [_jsx("p", { style: S.title, children: "\u3051\u3044\u3055\u3093\u3089\u3093\uFF08\u3058\u3086\u3046\u306B \u3064\u304B\u3063\u3066\u3044\u3044\u3088\uFF09" }), _jsx("button", { type: "button", onClick: clear, style: { ...S.ghost, marginLeft: 'auto' }, children: "\u305C\u3093\u3076 \u3051\u3059" })] }), ops.length > 1 && (_jsx("div", { style: { display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }, children: OPS.filter((o) => ops.includes(o.op)).map((o) => (_jsxs("button", { type: "button", onClick: () => setOp(o.op), style: S.opBtn(op === o.op), children: [o.op, " ", o.label] }, o.op))) })), op === '÷' ? _jsx(DivisionFrame, { grid: grid, cur: cur, setCur: setCur })
                : _jsx(ColumnFrame, { grid: grid, cur: cur, setCur: setCur, op: op }), _jsxs("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }, children: [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((n) => (_jsx("button", { type: "button", onClick: () => put(n), style: S.key, children: n }, n))), decimal && (_jsx("button", { type: "button", onClick: () => put('.'), style: S.key, children: "." })), _jsx("button", { type: "button", onClick: back, style: { ...S.key, color: '#e11d48' }, children: "\u2190" })] }), _jsx("p", { style: { fontSize: 11, color: '#8496ad', marginTop: 10, marginBottom: 0, lineHeight: 1.7 }, children: "\u3053\u3053\u306F \u7B54\u3048\u5408\u308F\u305B\u3092 \u3057\u306A\u3044\u3088\u3002\u3058\u3086\u3046\u306B \u66F8\u3044\u3066\u3001\u7B54\u3048\u306F \u4E0A\u306E \u3089\u3093\u306B \u5165\u308C\u3066\u306D\u3002" })] }));
}
/** たし算・ひき算・かけ算。上下にならべて、下に線を引く */
function ColumnFrame({ grid, cur, setCur, op }) {
    return (_jsx("div", { style: { overflowX: 'auto' }, children: _jsx("div", { style: { display: 'inline-block', minWidth: 300 }, children: grid.map((row, r) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center' }, children: [_jsx("span", { style: { width: 26, fontSize: 18, fontWeight: 800, color: '#7c8da6', textAlign: 'center' }, children: r === 1 ? op : '' }), _jsx("div", { style: {
                            display: 'flex',
                            borderBottom: r === 1 ? '2px solid #0f2540' : '1px solid #edf2f9',
                        }, children: row.map((v, c) => (_jsx("div", { onClick: () => setCur({ row: r, col: c }), style: S.cell(cur.row === r && cur.col === c), children: v }, c))) })] }, r))) }) }));
}
/** わり算。かぎかっこの形（わる数 ⌐ わられる数、上に商） */
function DivisionFrame({ grid, cur, setCur }) {
    return (_jsxs("div", { style: { overflowX: 'auto' }, children: [_jsx("div", { style: { display: 'inline-block', minWidth: 300 }, children: grid.map((row, r) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center' }, children: [_jsx("div", { style: {
                                width: 60, display: 'flex', justifyContent: 'flex-end',
                                borderRight: r === 1 ? '2px solid #0f2540' : 'none',
                                paddingRight: 4,
                            }, children: r === 1 && (_jsx("div", { onClick: () => setCur({ row: r, col: 0 }), style: S.cell(cur.row === r && cur.col === 0), children: row[0] })) }), _jsx("div", { style: {
                                display: 'flex',
                                borderTop: r === 1 ? '2px solid #0f2540' : 'none',
                                borderBottom: r >= 2 && r % 2 === 0 ? '1px solid #0f2540' : '1px solid #edf2f9',
                            }, children: row.slice(1).map((v, i) => {
                                const c = i + 1;
                                return (_jsx("div", { onClick: () => setCur({ row: r, col: c }), style: S.cell(cur.row === r && cur.col === c), children: v }, c));
                            }) })] }, r))) }), _jsx("p", { style: { fontSize: 11, color: '#8496ad', margin: '6px 0 0' }, children: "\u4E0A\u306E \u3060\u3093\u304C \u5546\u3001\u304B\u304E\u306E \u5DE6\u304C \u308F\u308B\u6570\u3001\u53F3\u304C \u308F\u3089\u308C\u308B\u6570\u3060\u3088\u3002" })] }));
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
                    padding: '8px 16px',
                    fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
                }, children: ["\uD83D\uDCDD ", open ? 'けいさんらんを とじる' : label] }), open && _jsx(ScratchPad, { ...rest })] }));
}
//# sourceMappingURL=ScratchPad.js.map