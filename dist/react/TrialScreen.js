import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * 神域の試練の画面（どの算数アプリでも同じ見た目・同じ決まり）。
 *
 *   極限 … やさしい層から登る。各層2問、同じ層で2回まちがえたら止まる。
 *   無限 … 神座に1度たどりついた子だけ。3回まちがえるまで挑み続ける。
 *
 * アプリが渡すのは「層（どの項目を出すか）」「本番テストとの対応」と、
 * 1問を作る関数・出す関数だけ。問題は**練習・本番テストと同じ画面**で出す
 * （練習で解ける問題は試練でも解ける。見たことのない形で測らない）。
 *
 * 1問は「ノーミスで解けたら正解」。1回まちがえた時点で×にして次へ進む
 * （測る場面なので、ヒントを見ながらの正解は数えない）。
 * 始めるときは必ずソロに切り替える（ペアの力で層を上げないように）。
 * 記録は端末に保存し、学級コードがあればサーバにも送る。アプリの学習ログには入れない。
 *
 * 見た目はインラインスタイルで自己完結させる（アプリごとのテーマに左右されない）。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { startClimb, answerClimb, pickClimbSkill, startEndless, answerEndless, pickEndless, summarize, predictScore, nextGain, saveTrial, syncTrialsFromServer, flushTrials, loadTrials, floorName, NUMERALS, SEAL_COUNT, MISSES_TO_STOP, ENDLESS_MISSES, QUESTIONS_PER_FLOOR, } from '../trial/index.js';
import { forceSolo } from '../sync/playMode.js';
const FONT = 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
const CYAN = '#67e8f9';
const FUCHSIA = '#f0abfc';
const GOLD = '#fde68a';
const DIM = 'rgba(255,255,255,0.55)';
const FAINT = 'rgba(255,255,255,0.35)';
const numeral = (i) => NUMERALS[i] ?? String(i + 1);
export function TrialScreen(props) {
    const { appId, floors, testReqs, testMax, generate, render, onExit, exitLabel = 'もどる', onPractice, sound } = props;
    const sync = useMemo(() => ({ appId, supabaseUrl: props.supabaseUrl, supabaseKey: props.supabaseKey }), [appId, props.supabaseUrl, props.supabaseKey]);
    const F = floors.length;
    const [records, setRecords] = useState(() => loadTrials(appId));
    const [phase, setPhase] = useState('HOME');
    const [climb, setClimb] = useState(null);
    const [endless, setEndless] = useState(null);
    const [q, setQ] = useState(null);
    const [flash, setFlash] = useState(null);
    const [soloNotice, setSoloNotice] = useState(false);
    const [last, setLast] = useState(null);
    const [prev, setPrev] = useState(null);
    const locked = useRef(false);
    const keyRef = useRef(0);
    // 端末のデータが消えていても、学級コードがあればサーバから取り戻す
    useEffect(() => {
        void syncTrialsFromServer(sync).then(setRecords);
        void flushTrials(sync);
    }, [sync]);
    const sum = useMemo(() => summarize(records, F), [records, F]);
    const ask = (floor, skillId) => {
        keyRef.current += 1;
        locked.current = false;
        setQ({ floor, skillId, data: generate(skillId, floor), key: keyRef.current });
    };
    const begin = (mode) => {
        if (forceSolo()) {
            setSoloNotice(true);
            setTimeout(() => setSoloNotice(false), 2600);
        }
        setPrev(sum);
        setFlash(null);
        if (mode === '極限') {
            const s = startClimb(F);
            setClimb(s);
            setEndless(null);
            setPhase('CLIMB');
            ask(0, pickClimbSkill(s, floors));
        }
        else {
            const s = startEndless();
            setEndless(s);
            setClimb(null);
            setPhase('ENDLESS');
            const n = pickEndless(s, floors);
            ask(n.floor, n.skillId);
        }
    };
    const finish = async (mode, cleared, score) => {
        const rec = await saveTrial(sync, { mode, floor: cleared, floors: F, score, soloComplete: true });
        setLast(rec);
        setRecords(loadTrials(appId));
        setPhase('RESULT');
        if (mode === '極限' && cleared >= F)
            sound?.clear?.();
    };
    const settle = (correct) => {
        if (locked.current || !q)
            return;
        locked.current = true;
        (correct ? sound?.correct : sound?.miss)?.();
        if (phase === 'CLIMB' && climb) {
            const next = answerClimb(climb, q.skillId, correct);
            setClimb(next);
            const clearedNow = next.cleared > climb.cleared;
            const skipped = next.skipped.length > climb.skipped.length;
            setFlash(skipped ? { kind: 'clear', text: `第${numeral(climb.at)}層 突破 ── 第${numeral(next.skipped[next.skipped.length - 1])}層を 越えた` }
                : clearedNow ? { kind: 'clear', text: `第${numeral(climb.at)}層 突破` }
                    : { kind: correct ? 'ok' : 'ng', text: correct ? '正解' : 'ミス' });
            setTimeout(() => {
                setFlash(null);
                if (next.done) {
                    void finish('極限', next.cleared, 0);
                    return;
                }
                ask(next.at, pickClimbSkill(next, floors));
            }, clearedNow ? 1100 : 650);
            return;
        }
        if (phase === 'ENDLESS' && endless) {
            const next = answerEndless(endless, q.floor, q.skillId, correct);
            setEndless(next);
            setFlash({ kind: correct ? 'ok' : 'ng', text: correct ? `+1　${next.score}` : 'ミス' });
            setTimeout(() => {
                setFlash(null);
                if (next.done) {
                    void finish('無限', F, next.score);
                    return;
                }
                const n = pickEndless(next, floors);
                ask(n.floor, n.skillId);
            }, 650);
        }
    };
    // 途中でやめた回は記録しない（刻印にも今の層にも数えない）
    const quit = () => { setPhase('HOME'); setClimb(null); setEndless(null); setQ(null); setFlash(null); };
    const ctx = { floors, testReqs, testMax, F };
    if (phase === 'HOME') {
        return (_jsxs(Shell, { onBack: onExit, backLabel: exitLabel, children: [_jsx(Title, {}), _jsx(Status, { sum: sum, ctx: ctx }), _jsx(Tower, { sum: sum, ctx: ctx }), _jsxs("div", { style: { display: 'grid', gap: 12, marginTop: 24 }, children: [_jsx(ModeButton, { mark: "\u25B2", title: "\u6975\u9650", tone: CYAN, sub: "\u3084\u3055\u3057\u3044\u5C64\u304B\u3089\u767B\u308A\u3001\u3069\u3053\u307E\u3067\u78BA\u5B9F\u306B\u3067\u304D\u308B\u304B\u3092\u6E2C\u308B\uFF0810\u5206\u307B\u3069\uFF09", onClick: () => begin('極限') }), _jsx(ModeButton, { mark: sum.endlessUnlocked ? '∞' : '🔒', title: "\u7121\u9650", tone: FUCHSIA, disabled: !sum.endlessUnlocked, sub: sum.endlessUnlocked
                                ? `まちがえるまで 挑み続ける（${ENDLESS_MISSES}回ミスで終了）　最高 ${sum.endlessBest}`
                                : '極限で 神座に たどりつくと 解放される', onClick: () => begin('無限') })] }), _jsx(Rules, {})] }));
    }
    if (phase === 'RESULT' && last) {
        return (_jsx(Shell, { onBack: () => setPhase('HOME'), backLabel: "\u795E\u57DF\u306E\u8A66\u7DF4\u3078", children: _jsx(Result, { last: last, sum: sum, prev: prev, ctx: ctx, onPractice: onPractice, onRetry: () => begin(last.mode) }) }));
    }
    const inClimb = phase === 'CLIMB' && climb;
    const fi = q?.floor ?? 0;
    return (_jsxs("div", { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#04070f', color: '#fff', fontFamily: FONT }, children: [_jsx("style", { children: KEYFRAMES }), _jsxs("div", { style: { flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,11,22,0.92)', padding: '10px 14px' }, children: [_jsxs("div", { style: { maxWidth: 1024, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", onClick: quit, style: btnGhost, children: "\u2039 \u3084\u3081\u308B" }), _jsx("span", { style: { padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 900, letterSpacing: '0.2em', background: 'rgba(103,232,249,0.15)', color: '#cffafe', border: '1px solid rgba(103,232,249,0.3)' }, children: inClimb ? '極限' : '無限' }), _jsxs("span", { style: { fontWeight: 900, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: [_jsxs("span", { style: { color: '#a5f3fc' }, children: ["\u7B2C", numeral(fi), "\u5C64"] }), _jsx("span", { style: { color: DIM, fontSize: 13, marginLeft: 8 }, children: floors[fi]?.label })] }), _jsxs("span", { style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }, children: [inClimb ? (_jsxs(_Fragment, { children: [_jsx(Pips, { label: "\u6B63\u89E3", n: climb.correct, max: QUESTIONS_PER_FLOOR, color: CYAN }), _jsx(Pips, { label: "\u30DF\u30B9", n: climb.misses, max: MISSES_TO_STOP, color: "#fb7185" })] })) : endless ? (_jsxs(_Fragment, { children: [_jsx("span", { style: { fontWeight: 900, color: '#f5d0fe' }, children: endless.score }), _jsx(Pips, { label: "\u30DF\u30B9", n: endless.misses, max: ENDLESS_MISSES, color: "#fb7185" })] })) : null, _jsx("button", { type: "button", onClick: () => settle(false), style: { ...btnGhost, border: '1px solid rgba(255,255,255,0.18)', fontSize: 12 }, children: "\u308F\u304B\u3089\u306A\u3044" })] })] }), inClimb && (_jsx("div", { style: { maxWidth: 1024, margin: '8px auto 0', display: 'flex', gap: 4 }, children: floors.map((_, i) => (_jsx("div", { style: {
                                height: 6, flex: 1, borderRadius: 999,
                                background: i < climb.cleared ? (climb.skipped.includes(i) ? 'rgba(253,230,138,0.7)' : CYAN)
                                    : i === climb.at ? 'rgba(103,232,249,0.4)' : 'rgba(255,255,255,0.1)',
                            } }, i))) }))] }), _jsx("div", { style: { flex: 1, minHeight: 0, overflowY: 'auto' }, children: _jsx("div", { style: { maxWidth: 1024, margin: '0 auto', padding: '20px 14px' }, children: q && render(q.data, { onResult: (perfect) => settle(perfect), onMiss: () => settle(false) }) }, q?.key) }), flash && (_jsx("div", { style: { position: 'fixed', inset: 0, zIndex: 40, display: 'grid', placeItems: 'center', pointerEvents: 'none' }, children: _jsx("div", { style: {
                        animation: 'lakTrialPop 180ms ease-out', padding: '14px 28px', borderRadius: 24, fontWeight: 900, fontSize: 26,
                        ...(flash.kind === 'ng' ? { background: 'rgba(76,5,25,0.8)', color: '#fecdd3', border: '1px solid rgba(251,113,133,0.4)' }
                            : flash.kind === 'ok' ? { background: 'rgba(8,51,68,0.8)', color: '#cffafe', border: '1px solid rgba(103,232,249,0.4)' }
                                : { background: 'rgba(11,16,36,0.9)', color: '#fef3c7', border: '1px solid rgba(253,230,138,0.5)', boxShadow: '0 0 60px -10px rgba(253,230,138,0.6)' }),
                    }, children: flash.text }) })), soloNotice && (_jsx("div", { style: { position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 40, padding: '8px 16px', borderRadius: 12, background: '#0b1024', border: '1px solid rgba(103,232,249,0.4)', color: '#cffafe', fontSize: 14, fontWeight: 900 }, children: "\u8A66\u7DF4\u306F \u3072\u3068\u308A\u3067\u3002SOLO \u306B \u304D\u308A\u304B\u3048\u305F\u3088" }))] }));
}
const KEYFRAMES = '@keyframes lakTrialPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}';
const btnGhost = {
    background: 'transparent', border: 0, color: 'rgba(255,255,255,0.65)', fontWeight: 800,
    padding: '6px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: FONT, fontSize: 14,
};
function Shell({ onBack, backLabel, children }) {
    return (_jsxs("div", { style: {
            width: '100%', height: '100%', overflowY: 'auto', color: '#fff', fontFamily: FONT,
            background: 'radial-gradient(ellipse at top, #101a36 0%, #04070f 60%)',
        }, children: [_jsx("style", { children: KEYFRAMES }), _jsxs("div", { style: { maxWidth: 672, margin: '0 auto', padding: '20px 16px 40px' }, children: [_jsxs("button", { type: "button", onClick: onBack, style: { ...btnGhost, fontSize: 15, marginBottom: 8 }, children: ["\u2039 ", backLabel] }), children] })] }));
}
function Title() {
    return (_jsxs("div", { style: { textAlign: 'center', margin: '8px 0 24px' }, children: [_jsx("p", { style: { fontSize: 11, letterSpacing: '0.5em', color: 'rgba(103,232,249,0.8)', fontWeight: 900, margin: 0 }, children: "SANCTUM TRIAL" }), _jsx("h1", { style: {
                    fontSize: 36, fontWeight: 900, margin: '8px 0 0',
                    background: 'linear-gradient(to bottom, #fff, #a5f3fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }, children: "\u795E\u57DF\u306E\u8A66\u7DF4" }), _jsx("p", { style: { color: DIM, fontWeight: 700, fontSize: 14, margin: '8px 0 0' }, children: "\u3044\u307E\u306E \u81EA\u5206\u304C\u3001\u3069\u306E\u5C64\u307E\u3067 \u78BA\u5B9F\u306B \u767B\u308C\u308B\u304B" })] }));
}
function Status({ sum, ctx }) {
    const { testReqs, testMax, F } = ctx;
    const predicted = predictScore(testReqs, sum.sealed); // 予想点は刻印（確かな力）で出す
    const today = sum.current ?? 0;
    const todayPred = predictScore(testReqs, today);
    const gain = nextGain(testReqs, sum.sealed, F);
    return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }, children: [_jsx(Stat, { label: "\u4ECA\u306E\u5C64", value: sum.current === null ? '—' : floorName(sum.current, F), sub: "\u3044\u3061\u3070\u3093\u65B0\u3057\u3044 \u6975\u9650" }), _jsx(Stat, { label: "\u523B\u5370", value: sum.sealed ? floorName(sum.sealed, F) : 'なし', glow: true, sub: sum.nextSeal ? `${floorName(sum.nextSeal.floor, F)}まで ${Math.min(sum.nextSeal.count, SEAL_COUNT)}/${SEAL_COUNT}` : '全層に刻印' }), _jsx(Stat, { label: "\u30C6\u30B9\u30C8\u4E88\u60F3", value: `${predicted}`, unit: `/${testMax}`, sub: gain ? `${floorName(gain.floor, F)}に刻印で +${gain.gain}点` : 'これ以上は 上がらない' }), sum.current !== null && todayPred !== predicted && (_jsxs("p", { style: { gridColumn: '1 / -1', fontSize: 11, color: DIM, fontWeight: 700, textAlign: 'center', margin: 0 }, children: ["\u4ECA\u65E5\u306E\u7D50\u679C\uFF08", floorName(today, F), "\uFF09\u306A\u3089 ", todayPred, "\u70B9\u3002\u523B\u5370\u304C\u305D\u308D\u3046\u3068 \u4E88\u60F3\u306B\u5165\u308B\u3088"] }))] }));
}
function Stat({ label, value, unit, sub, glow }) {
    return (_jsxs("div", { style: {
            borderRadius: 16, padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
            border: glow ? '1px solid rgba(253,230,138,0.4)' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: glow ? '0 0 30px -14px rgba(253,230,138,0.8)' : undefined,
        }, children: [_jsx("p", { style: { fontSize: 10, letterSpacing: '0.2em', color: DIM, fontWeight: 900, margin: 0 }, children: label }), _jsxs("p", { style: { fontSize: 18, fontWeight: 900, margin: '4px 0 0', lineHeight: 1.2 }, children: [value, unit && _jsx("span", { style: { fontSize: 12, color: DIM, marginLeft: 2 }, children: unit })] }), sub && _jsx("p", { style: { fontSize: 10, color: DIM, fontWeight: 700, margin: '4px 0 0', lineHeight: 1.4 }, children: sub })] }));
}
/** 塔。上が神座。刻印・ベスト・今の層に印を付ける */
function Tower({ sum, ctx }) {
    const { floors, F } = ctx;
    const rows = [{ idx: F, name: '神座', label: '全層を 突破した者の 座' },
        ...floors.map((f, i) => ({ idx: i, name: `第${numeral(i)}層`, label: f.label })).reverse()];
    return (_jsx("div", { style: { marginTop: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', padding: 10, display: 'grid', gap: 6 }, children: rows.map((r) => {
            const throne = r.idx === F;
            const need = throne ? F : r.idx + 1;
            const sealed = sum.sealed >= need;
            const best = sum.best >= need;
            // 「いま」は、いちばん新しい極限で突破した最も高い層（上の「今の層」と同じ層）
            const here = sum.current !== null && sum.current >= 1
                && (throne ? sum.current >= F : sum.current < F && sum.current - 1 === r.idx);
            return (_jsxs("div", { style: {
                    display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, padding: '7px 12px',
                    border: `1px solid ${sealed ? 'rgba(253,230,138,0.5)' : best ? 'rgba(103,232,249,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    background: sealed ? 'rgba(254,243,199,0.06)' : best ? 'rgba(103,232,249,0.05)' : 'transparent',
                }, children: [_jsx("span", { style: { width: 60, flexShrink: 0, fontWeight: 900, fontSize: 14, color: sealed ? '#fef3c7' : best ? '#a5f3fc' : FAINT }, children: r.name }), _jsx("span", { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700, color: best ? 'rgba(255,255,255,0.8)' : FAINT }, children: r.label }), sealed && _jsx("span", { style: { fontSize: 10, fontWeight: 900, color: GOLD, letterSpacing: '0.15em' }, children: "\u2726\u523B\u5370" }), here && _jsx("span", { style: { fontSize: 10, fontWeight: 900, color: '#a5f3fc', letterSpacing: '0.15em' }, children: "\u2691\u3044\u307E" })] }, r.name));
        }) }));
}
function ModeButton({ mark, title, sub, tone, disabled, onClick }) {
    return (_jsxs("button", { type: "button", onClick: () => !disabled && onClick(), disabled: disabled, style: {
            width: '100%', textAlign: 'left', padding: 16, borderRadius: 22, display: 'flex', alignItems: 'center', gap: 16,
            cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: FONT, color: disabled ? 'rgba(255,255,255,0.4)' : '#fff',
            border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : tone + '66'}`,
            background: disabled ? 'rgba(255,255,255,0.02)' : tone + '14',
            boxShadow: disabled ? undefined : `0 0 40px -18px ${tone}`,
        }, children: [_jsx("span", { style: {
                    width: 48, height: 48, borderRadius: 16, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 22, fontWeight: 900,
                    background: disabled ? 'rgba(255,255,255,0.05)' : tone + '26', color: disabled ? FAINT : tone,
                }, children: mark }), _jsxs("span", { style: { minWidth: 0 }, children: [_jsx("span", { style: { display: 'block', fontSize: 24, fontWeight: 900, letterSpacing: '0.3em' }, children: title }), _jsx("span", { style: { display: 'block', fontSize: 12, fontWeight: 700, opacity: 0.7, marginTop: 2 }, children: sub })] })] }));
}
function Rules() {
    const p = { margin: '4px 0 0' };
    return (_jsxs("div", { style: { marginTop: 24, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }, children: [_jsxs("p", { style: p, children: ["\u30FB\u5404\u5C64 ", QUESTIONS_PER_FLOOR, "\u554F\u3002\u30CE\u30FC\u30DF\u30B9\u3067\u89E3\u3051\u305F\u554F\u984C\u3060\u3051\u304C \u6B63\u89E3\u3002\u540C\u3058\u5C64\u3067 ", MISSES_TO_STOP, "\u56DE \u307E\u3061\u304C\u3048\u305F\u3089 \u305D\u3053\u3067\u6B62\u307E\u308B\u3002"] }), _jsx("p", { style: p, children: "\u30FB2\u5C64\u3064\u3065\u3051\u3066 \u30CE\u30FC\u30DF\u30B9\u306A\u3089\u3001\u6B21\u306E\u5C64\u3092 \u98DB\u3073\u3053\u3048\u308B\uFF08\u6700\u5F8C\u306E\u5C64\u306F \u5FC5\u305A\u89E3\u304F\uFF09\u3002" }), _jsxs("p", { style: p, children: ["\u30FB\u305D\u306E\u5C64\u307E\u3067 \u5C4A\u3044\u305F\u56DE\u304C \u901A\u7B97", SEAL_COUNT, "\u56DE\u306B \u306A\u308B\u3068\u300C\u523B\u5370\u300D\u3002\u3072\u3068\u308A\u3067 \u6700\u5F8C\u307E\u3067 \u3084\u3063\u305F\u56DE\u3060\u3051 \u6570\u3048\u308B\u3002"] }), _jsx("p", { style: p, children: "\u30FB\u300C\u4ECA\u306E\u5C64\u300D\u306F \u3044\u3061\u3070\u3093\u65B0\u3057\u3044\u7D50\u679C\u3002\u4E0B\u304C\u308B\u3053\u3068\u3082 \u3042\u308B\u3002\u523B\u5370\u306F \u6D88\u3048\u306A\u3044\u3002" })] }));
}
function Pips({ label, n, max, color }) {
    return (_jsx("span", { style: { display: 'flex', alignItems: 'center', gap: 4 }, title: label, "aria-label": `${label} ${n}/${max}`, children: Array.from({ length: max }, (_, i) => (_jsx("span", { style: { width: 10, height: 10, borderRadius: 999, background: i < n ? color : 'rgba(255,255,255,0.15)' } }, i))) }));
}
function Result({ last, sum, prev, ctx, onPractice, onRetry }) {
    const { floors, testReqs, F } = ctx;
    const newSeal = prev && sum.sealed > prev.sealed;
    const bigBtn = (bg, fg, border) => ({
        width: '100%', padding: '12px 0', borderRadius: 16, fontWeight: 900, fontSize: 15, cursor: 'pointer',
        background: bg, color: fg, border: border ?? 0, fontFamily: FONT,
    });
    if (last.mode === '無限') {
        const best = prev ? last.score > prev.endlessBest : true;
        return (_jsxs("div", { style: { textAlign: 'center', marginTop: 24 }, children: [_jsx("p", { style: { fontSize: 11, letterSpacing: '0.5em', color: 'rgba(240,171,252,0.8)', fontWeight: 900, margin: 0 }, children: "INFINITE" }), _jsx("p", { style: { fontSize: 60, fontWeight: 900, margin: '12px 0 0' }, children: last.score }), _jsx("p", { style: { color: DIM, fontWeight: 700, margin: '8px 0 0' }, children: best ? '自己ベスト 更新！' : `自己ベスト ${sum.endlessBest}` }), _jsx("div", { style: { marginTop: 32 }, children: _jsx("button", { type: "button", onClick: onRetry, style: bigBtn('rgba(240,171,252,0.15)', '#fff', '1px solid rgba(240,171,252,0.4)'), children: "\u3082\u3046\u4E00\u5EA6 \u6311\u3080" }) })] }));
    }
    // 次にやるべき層＝止まった層。そこで出る項目の練習へ飛ばす
    const stuck = last.floor < F ? floors[last.floor] : null;
    const gain = nextGain(testReqs, sum.sealed, F);
    return (_jsxs("div", { style: { marginTop: 16 }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("p", { style: { fontSize: 11, letterSpacing: '0.5em', color: 'rgba(103,232,249,0.8)', fontWeight: 900, margin: 0 }, children: "RESULT" }), _jsx("p", { style: { fontSize: 40, fontWeight: 900, margin: '12px 0 0' }, children: last.floor >= F ? '神座' : last.floor === 0 ? '第Ⅰ層で 止まった' : `第${numeral(last.floor - 1)}層 突破` }), last.floor !== 0 && (_jsx("p", { style: { color: DIM, fontWeight: 700, margin: '8px 0 0' }, children: last.floor >= F ? '全層を 突破した。無限が ひらく。' : `第${numeral(last.floor)}層で 止まった` })), newSeal && (_jsxs("p", { style: {
                            display: 'inline-block', marginTop: 16, padding: '8px 16px', borderRadius: 999, animation: 'lakTrialPop 300ms ease-out',
                            border: '1px solid rgba(253,230,138,0.6)', background: 'rgba(254,243,199,0.1)', color: '#fef3c7', fontWeight: 900,
                            boxShadow: '0 0 40px -10px rgba(253,230,138,0.8)',
                        }, children: ["\u2726 ", floorName(sum.sealed, F), " \u306B \u523B\u5370"] }))] }), _jsx("div", { style: { marginTop: 24 }, children: _jsx(Status, { sum: sum, ctx: ctx }) }), stuck && (_jsxs("div", { style: { marginTop: 24, borderRadius: 22, border: '1px solid rgba(103,232,249,0.3)', background: 'rgba(103,232,249,0.06)', padding: 16 }, children: [_jsx("p", { style: { fontSize: 12, fontWeight: 900, color: '#a5f3fc', margin: 0 }, children: "\u25CE \u3044\u307E \u3084\u308B\u3079\u304D\u3053\u3068" }), _jsxs("p", { style: { fontSize: 18, fontWeight: 900, margin: '4px 0 0' }, children: ["\u7B2C", numeral(last.floor), "\u5C64\uFF1A", stuck.label] }), gain && _jsxs("p", { style: { fontSize: 12, color: DIM, fontWeight: 700, margin: '4px 0 0' }, children: [floorName(gain.floor, F), "\u306B \u523B\u5370\u304C \u305D\u308D\u3046\u3068\u3001\u30C6\u30B9\u30C8\u4E88\u60F3\u304C +", gain.gain, "\u70B9"] }), onPractice && stuck.skills[0] && (_jsx("div", { style: { marginTop: 12 }, children: _jsx("button", { type: "button", onClick: () => onPractice(stuck.skills[0]), style: bigBtn(CYAN, '#04070f'), children: "\u3053\u306E\u5C64\u306E \u308C\u3093\u3057\u3085\u3046\u3078" }) }))] })), _jsx("div", { style: { marginTop: 16 }, children: _jsx("button", { type: "button", onClick: onRetry, style: bigBtn('transparent', '#fff', '1px solid rgba(255,255,255,0.18)'), children: "\u3082\u3046\u4E00\u5EA6 \u767B\u308B" }) })] }));
}
/**
 * ハブに置く入口のカード。**ハブのいちばん下に置く**（毎日の練習の入口より目立たせない）。
 * 今の層と刻印を、端末の記録から出す。
 */
export function TrialCard({ appId, floors, onClick }) {
    const sum = useMemo(() => summarize(loadTrials(appId), floors), [appId, floors]);
    return (_jsxs("button", { type: "button", onClick: onClick, style: {
            width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: FONT, color: '#fff',
            borderRadius: 24, padding: '18px 20px', border: '1px solid rgba(103,232,249,0.35)',
            background: 'radial-gradient(ellipse at top left, #13214a 0%, #04070f 70%)',
            boxShadow: '0 0 50px -24px rgba(103,232,249,0.9)', display: 'flex', alignItems: 'center', gap: 16,
        }, children: [_jsx("span", { style: { width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 24, background: 'rgba(103,232,249,0.15)', color: CYAN }, children: "\u25B2" }), _jsxs("span", { style: { minWidth: 0, flex: 1 }, children: [_jsx("span", { style: { display: 'block', fontSize: 10, letterSpacing: '0.4em', color: 'rgba(103,232,249,0.8)', fontWeight: 900 }, children: "SANCTUM TRIAL" }), _jsx("span", { style: { display: 'block', fontSize: 22, fontWeight: 900, marginTop: 2 }, children: "\u795E\u57DF\u306E\u8A66\u7DF4" }), _jsx("span", { style: { display: 'block', fontSize: 12, color: DIM, fontWeight: 700, marginTop: 2 }, children: sum.runs === 0 ? 'この単元を どこまで 確実に できるか 測ろう'
                            : `今の層 ${sum.current === null ? '—' : floorName(sum.current, floors)}　刻印 ${sum.sealed ? floorName(sum.sealed, floors) : 'なし'}` })] }), _jsx("span", { style: { fontSize: 22, color: FAINT }, children: "\u203A" })] }));
}
//# sourceMappingURL=TrialScreen.js.map