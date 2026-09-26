import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * 実力の階段（STEP TO 算数MASTER）の画面。どの算数アプリでも同じ見た目・同じ決まり。
 *
 *   極限 … やさしい段から登る。各段2問、同じ段で2回まちがえたら止まる。範囲は本番テストと同じ
 *   無限 … 頂点に1度たどりついた子だけ。単元のすべての項目で、3回まちがえるまで挑み続ける
 *
 * アプリが渡すのは「段（どの項目を出すか）」「本番テストとの対応」と、
 * 1問を作る関数・出す関数だけ。問題は**練習・本番テストと同じ画面**で出す。
 *
 * 1問は「ノーミスで解けたら正解」。1回まちがえた時点で×にして次へ進む。
 * 始めるときは必ずソロに切り替える（ペアの力で段を上げないように）。
 * 記録は端末に保存し、学級コードがあればサーバにも送る。アプリの学習ログには入れない。
 *
 * 見た目: 黒地にネオンの水色（自分の進み）と、オレンジ（セーブ＝消えない到達）の2色だけ。
 * インラインスタイルで自己完結させる（アプリごとのテーマに左右されない）。
 * 数字は他の子と比べない。比べるのは過去の自分だけ。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { startClimb, answerClimb, pickClimbSkill, startEndless, answerEndless, pickEndless, summarize, predictScore, nextGain, saveTrial, syncTrialsFromServer, flushTrials, loadTrials, floorName, TRIAL_NAME, TRIAL_SUBTITLE, SAVE_NAME, SEAL_COUNT, MISSES_TO_STOP, ENDLESS_MISSES, QUESTIONS_PER_FLOOR, } from '../trial/index.js';
import { forceSolo } from '../sync/playMode.js';
/* ---------------- 色と字 ---------------- */
const FONT = 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
/** 英字の見出しだけに使う。読みこめない端末では system-ui で出る */
const DISPLAY = `"Orbitron", ${FONT}`;
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const BG = '#010307';
const CYAN = '#22e7ff';
const CYAN_SOFT = 'rgba(34,231,255,0.14)';
const ORANGE = '#ff9d2e';
const ORANGE_SOFT = 'rgba(255,157,46,0.14)';
const INK = '#e8fbff';
const DIM = 'rgba(232,251,255,0.58)';
const FAINT = 'rgba(232,251,255,0.32)';
const LINE = 'rgba(34,231,255,0.22)';
const RED = '#ff5577';
const glow = (c, r = 14) => `0 0 ${r}px ${c}, 0 0 ${r * 2}px ${c}55`;
const textGlow = (c) => `0 0 8px ${c}, 0 0 22px ${c}88`;
const KEYFRAMES = `
@keyframes lakPop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes lakPulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes lakTrail{from{background-position:0 0}to{background-position:200px 0}}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
`;
/** Orbitron を1回だけ読みこむ（英字の見出し用） */
function useDisplayFont() {
    useEffect(() => {
        if (typeof document === 'undefined' || document.getElementById('lak-orbitron'))
            return;
        const l = document.createElement('link');
        l.id = 'lak-orbitron';
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&display=swap';
        document.head.appendChild(l);
    }, []);
}
const stepName = (i, F) => (i >= F ? 'EXTRA' : `第${i + 1}段`);
/* ================================================================== */
export function TrialScreen(props) {
    const { appId, floors, testReqs, testMax, generate, render, onExit, exitLabel = 'もどる', onPractice, sound } = props;
    const endlessFloors = props.endlessFloors ?? floors;
    useDisplayFont();
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
            const n = pickEndless(s, endlessFloors);
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
            setFlash(skipped ? { kind: 'clear', text: `第${climb.at + 1}段 突破 ── 第${next.skipped[next.skipped.length - 1] + 1}段を 飛びこえた` }
                : clearedNow ? { kind: 'clear', text: `第${climb.at + 1}段 突破` }
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
                const n = pickEndless(next, endlessFloors);
                ask(n.floor, n.skillId);
            }, 650);
        }
    };
    // 途中でやめた回は記録しない（セーブにも今の段にも数えない）
    const quit = () => { setPhase('HOME'); setClimb(null); setEndless(null); setQ(null); setFlash(null); };
    const ctx = { floors, testReqs, testMax, F };
    if (phase === 'HOME') {
        return (_jsxs(Shell, { onBack: onExit, backLabel: exitLabel, children: [_jsx(Title, {}), _jsx(Status, { sum: sum, ctx: ctx }), _jsx(Stairs, { sum: sum, ctx: ctx }), _jsx(Effort, { records: records, sum: sum, F: F }), _jsxs("div", { style: { display: 'grid', gap: 12, marginTop: 22 }, children: [_jsx(ModeButton, { code: "LIMIT", title: "\u6975\u9650", tone: CYAN, sub: "\u3084\u3055\u3057\u3044\u6BB5\u304B\u3089\u767B\u308A\u3001\u3069\u3053\u307E\u3067\u78BA\u5B9F\u306B\u3067\u304D\u308B\u304B\u3092\u6E2C\u308B\uFF0810\u5206\u307B\u3069\uFF09", onClick: () => begin('極限') }), _jsx(ModeButton, { code: "INFINITY", title: "\u7121\u9650", tone: CYAN, disabled: !sum.endlessUnlocked, sub: sum.endlessUnlocked
                                ? `単元の すべての項目で、まちがえるまで挑み続ける（${ENDLESS_MISSES}回ミスで終了）　最高 ${sum.endlessBest}`
                                : '極限で 頂点に たどりつくと 解放される', onClick: () => begin('無限') })] }), _jsx(Rules, {})] }));
    }
    if (phase === 'RESULT' && last) {
        return (_jsx(Shell, { onBack: () => setPhase('HOME'), backLabel: `${TRIAL_NAME}へ`, children: _jsx(Result, { last: last, sum: sum, prev: prev, ctx: ctx, onPractice: onPractice, onRetry: () => begin(last.mode) }) }));
    }
    const inClimb = phase === 'CLIMB' && climb;
    const fi = q?.floor ?? 0;
    const fl = inClimb ? floors[fi] : endlessFloors[fi];
    return (_jsxs("div", { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: BG, color: INK, fontFamily: FONT, position: 'relative' }, children: [_jsx("style", { children: KEYFRAMES }), _jsx(Grid, {}), _jsxs("div", { style: { position: 'relative', flexShrink: 0, borderBottom: `1px solid ${LINE}`, background: 'rgba(1,3,7,0.9)', padding: '10px 14px 12px' }, children: [_jsxs("div", { style: { maxWidth: 1024, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, children: [_jsx("button", { type: "button", onClick: quit, style: btnGhost, children: "\u2039 \u3084\u3081\u308B" }), _jsx("span", { style: { padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 900, letterSpacing: '0.2em', color: CYAN, border: `1px solid ${CYAN}`, boxShadow: glow(CYAN_SOFT, 8) }, children: inClimb ? '極限' : '無限' }), _jsxs("span", { style: { fontWeight: 900, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: [_jsx("span", { style: { color: CYAN, textShadow: textGlow(CYAN_SOFT) }, children: stepName(fi, F) }), _jsx("span", { style: { color: DIM, fontSize: 13, marginLeft: 8 }, children: fl?.label })] }), _jsxs("span", { style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }, children: [inClimb ? (_jsxs(_Fragment, { children: [_jsx(Pips, { label: "\u6B63\u89E3", n: climb.correct, max: QUESTIONS_PER_FLOOR, color: CYAN }), _jsx(Pips, { label: "\u30DF\u30B9", n: climb.misses, max: MISSES_TO_STOP, color: RED })] })) : endless ? (_jsxs(_Fragment, { children: [_jsx("span", { style: { fontFamily: MONO, fontWeight: 900, color: CYAN, fontSize: 18 }, children: endless.score }), _jsx(Pips, { label: "\u30DF\u30B9", n: endless.misses, max: ENDLESS_MISSES, color: RED })] })) : null, _jsx("button", { type: "button", onClick: () => settle(false), style: { ...btnGhost, border: `1px solid ${LINE}`, fontSize: 12 }, children: "\u308F\u304B\u3089\u306A\u3044" })] })] }), inClimb && _jsx(LightTrail, { climb: climb, F: F })] }), _jsx("div", { style: { position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto' }, children: _jsx("div", { style: { maxWidth: 1024, margin: '0 auto', padding: '20px 14px' }, children: q && render(q.data, { onResult: (perfect) => settle(perfect), onMiss: () => settle(false) }) }, q?.key) }), flash && (_jsx("div", { style: { position: 'fixed', inset: 0, zIndex: 40, display: 'grid', placeItems: 'center', pointerEvents: 'none' }, children: _jsx("div", { style: {
                        animation: 'lakPop 180ms ease-out', padding: '14px 30px', borderRadius: 8, fontWeight: 900, fontSize: 26,
                        background: 'rgba(1,3,7,0.9)',
                        ...(flash.kind === 'ng' ? { color: '#ffd0da', border: `1px solid ${RED}`, boxShadow: glow('rgba(255,85,119,0.35)') }
                            : flash.kind === 'ok' ? { color: INK, border: `1px solid ${CYAN}`, boxShadow: glow(CYAN_SOFT) }
                                : { color: CYAN, border: `1px solid ${CYAN}`, boxShadow: glow('rgba(34,231,255,0.45)', 24), textShadow: textGlow(CYAN_SOFT) }),
                    }, children: flash.text }) })), soloNotice && (_jsx("div", { style: { position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 40, padding: '8px 16px', borderRadius: 6, background: BG, border: `1px solid ${CYAN}`, color: INK, fontSize: 14, fontWeight: 900, boxShadow: glow(CYAN_SOFT) }, children: "\u5B9F\u529B\u306E\u968E\u6BB5\u306F \u3072\u3068\u308A\u3067\u3002SOLO \u306B \u304D\u308A\u304B\u3048\u305F\u3088" }))] }));
}
const btnGhost = {
    background: 'transparent', border: 0, color: DIM, fontWeight: 800,
    padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT, fontSize: 14,
};
/** 奥へのびるグリッドの床（トロンの地面） */
function Grid() {
    return (_jsxs("div", { "aria-hidden": true, style: { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }, children: [_jsx("div", { style: {
                    position: 'absolute', left: '-50%', right: '-50%', bottom: '-10%', height: '60%',
                    backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
                    backgroundSize: '48px 48px',
                    transform: 'perspective(420px) rotateX(62deg)', transformOrigin: 'bottom',
                    maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                    WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                    opacity: 0.55,
                } }), _jsx("div", { style: { position: 'absolute', left: 0, right: 0, top: 0, height: 220, background: `radial-gradient(ellipse at top, rgba(34,231,255,0.10), transparent 70%)` } })] }));
}
function Shell({ onBack, backLabel, children }) {
    return (_jsxs("div", { style: { position: 'relative', width: '100%', height: '100%', overflowY: 'auto', color: INK, fontFamily: FONT, background: BG }, children: [_jsx("style", { children: KEYFRAMES }), _jsx(Grid, {}), _jsxs("div", { style: { position: 'relative', maxWidth: 672, margin: '0 auto', padding: '18px 16px 48px' }, children: [_jsxs("button", { type: "button", onClick: onBack, style: { ...btnGhost, fontSize: 15, marginBottom: 6 }, children: ["\u2039 ", backLabel] }), children] })] }));
}
function Title() {
    return (_jsxs("div", { style: { textAlign: 'center', margin: '6px 0 22px' }, children: [_jsx("h1", { style: { fontSize: 38, fontWeight: 900, margin: 0, letterSpacing: '0.08em', color: INK, textShadow: textGlow('rgba(34,231,255,0.55)') }, children: TRIAL_NAME }), _jsx("p", { style: { fontFamily: DISPLAY, fontSize: 11, fontWeight: 800, letterSpacing: '0.38em', color: CYAN, margin: '8px 0 0', opacity: 0.9 }, children: TRIAL_SUBTITLE }), _jsx("div", { style: { margin: '14px auto 0', width: 160, height: 1, background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`, boxShadow: glow(CYAN_SOFT, 6) } })] }));
}
function Status({ sum, ctx }) {
    const { testReqs, testMax, F } = ctx;
    const predicted = predictScore(testReqs, sum.sealed); // 予想点はセーブ（確かな力）で出す
    const today = sum.current ?? 0;
    const todayPred = predictScore(testReqs, today);
    const gain = nextGain(testReqs, sum.sealed, F);
    return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }, children: [_jsx(Stat, { code: "NOW", label: "\u4ECA\u306E\u6BB5", value: sum.current === null ? '—' : floorName(sum.current, F), sub: "\u3044\u3061\u3070\u3093\u65B0\u3057\u3044 \u6975\u9650", color: CYAN }), _jsx(Stat, { code: "SAVE", label: SAVE_NAME, value: sum.sealed ? floorName(sum.sealed, F) : 'なし', color: ORANGE, sub: sum.nextSeal ? `${floorName(sum.nextSeal.floor, F)}まで ${Math.min(sum.nextSeal.count, SEAL_COUNT)}/${SEAL_COUNT}` : '頂点を セーブ済み' }), _jsx(Stat, { code: "SCORE", label: "\u30C6\u30B9\u30C8\u4E88\u60F3", value: `${predicted}`, unit: `/${testMax}`, color: CYAN, sub: gain ? `${floorName(gain.floor, F)}を セーブで +${gain.gain}点` : 'これ以上は 上がらない' }), sum.current !== null && todayPred !== predicted && (_jsxs("p", { style: { gridColumn: '1 / -1', fontSize: 11, color: DIM, fontWeight: 700, textAlign: 'center', margin: 0 }, children: ["\u4ECA\u65E5\u306E\u7D50\u679C\uFF08", floorName(today, F), "\uFF09\u306A\u3089 ", todayPred, "\u70B9\u3002", SAVE_NAME, "\u3055\u308C\u308B\u3068 \u4E88\u60F3\u306B\u5165\u308B\u3088"] }))] }));
}
function Stat({ code, label, value, unit, sub, color }) {
    return (_jsxs("div", { style: {
            borderRadius: 6, padding: '10px 12px', background: 'rgba(1,3,7,0.72)',
            border: `1px solid ${color}66`, boxShadow: `inset 0 0 18px ${color}14`,
        }, children: [_jsxs("p", { style: { margin: 0, display: 'flex', alignItems: 'baseline', gap: 6 }, children: [_jsx("span", { style: { fontFamily: DISPLAY, fontSize: 9, letterSpacing: '0.25em', color, fontWeight: 800 }, children: code }), _jsx("span", { style: { fontSize: 10, color: DIM, fontWeight: 800 }, children: label })] }), _jsxs("p", { style: { fontSize: 19, fontWeight: 900, margin: '4px 0 0', lineHeight: 1.2, color: INK }, children: [value, unit && _jsx("span", { style: { fontSize: 12, color: DIM, marginLeft: 2, fontFamily: MONO }, children: unit })] }), sub && _jsx("p", { style: { fontSize: 10, color: DIM, fontWeight: 700, margin: '4px 0 0', lineHeight: 1.4 }, children: sub })] }));
}
/**
 * 光る階段。右上へのぼっていく。いちばん上が頂点。
 * 水色＝届いたことがある段、オレンジ＝セーブした段、脈打つ印＝今の段。
 */
function Stairs({ sum, ctx }) {
    const { floors, F } = ctx;
    const rows = [{ idx: F, name: '頂点', label: '全段を 突破した者だけが 立てる場所' },
        ...floors.map((f, i) => ({ idx: i, name: `第${i + 1}段`, label: f.label })).reverse()];
    const n = rows.length;
    return (_jsx("div", { style: { marginTop: 22, padding: '14px 10px 10px', borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(1,3,7,0.6)' }, children: rows.map((r, row) => {
            const top = r.idx === F;
            const need = top ? F : r.idx + 1;
            const saved = sum.sealed >= need;
            const reached = sum.best >= need;
            const here = sum.current !== null && sum.current >= 1
                && (top ? sum.current >= F : sum.current < F && sum.current - 1 === r.idx);
            // 下の段ほど左、上の段ほど右から始めて「右上へのぼる」形にする
            const shift = (row / Math.max(1, n - 1)) * 34;
            const color = saved ? ORANGE : reached ? CYAN : FAINT;
            return (_jsxs("div", { style: {
                    display: 'flex', alignItems: 'center', gap: 10, marginLeft: `${34 - shift}%`,
                    padding: '7px 10px', marginBottom: 4,
                    borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`,
                    boxShadow: saved || reached ? `0 6px 14px -8px ${color}` : undefined,
                    background: saved ? ORANGE_SOFT : reached ? CYAN_SOFT : 'transparent',
                }, children: [_jsx("span", { style: { width: 56, flexShrink: 0, fontWeight: 900, fontSize: 13, color, textShadow: saved || reached ? textGlow(`${color}55`) : undefined }, children: r.name }), _jsx("span", { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 700, color: reached ? DIM : FAINT }, children: r.label }), saved && _jsx("span", { style: { fontFamily: DISPLAY, fontSize: 9, fontWeight: 800, color: ORANGE, letterSpacing: '0.2em' }, children: "SAVE" }), here && _jsx("span", { style: { fontSize: 10, fontWeight: 900, color: CYAN, letterSpacing: '0.1em', animation: 'lakPulse 1.4s ease-in-out infinite' }, children: "\u25B6\u3044\u307E" })] }, r.name));
        }) }));
}
/**
 * 努力と伸びの見える化。数えるのは自分の記録だけ（他の子とは比べない）。
 *   挑戦した回数・今日の回数・自己最高・無限の最高と、極限の1回ごとの到達段の折れ線。
 */
function Effort({ records, sum, F }) {
    const climbs = records.filter((r) => r.mode === '極限').sort((a, b) => a.ts - b.ts);
    if (climbs.length === 0)
        return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = climbs.filter((r) => r.ts >= today.getTime()).length;
    // 自己最高を更新した回（はじめて その段以上に届いた回）
    let best = 0;
    let updates = 0;
    for (const r of climbs)
        if (r.floor > best) {
            best = r.floor;
            updates++;
        }
    const recent = climbs.slice(-20);
    const W = 300;
    const H = 90;
    const P = 8;
    const x = (i) => P + (recent.length === 1 ? (W - 2 * P) / 2 : (i / (recent.length - 1)) * (W - 2 * P));
    const y = (v) => H - P - (v / Math.max(1, F)) * (H - 2 * P);
    const pts = recent.map((r, i) => `${x(i)},${y(r.floor)}`).join(' ');
    return (_jsxs("div", { style: { marginTop: 18, borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(1,3,7,0.6)', padding: 14 }, children: [_jsxs("p", { style: { margin: 0, display: 'flex', alignItems: 'baseline', gap: 8 }, children: [_jsx("span", { style: { fontFamily: DISPLAY, fontSize: 9, letterSpacing: '0.3em', color: CYAN, fontWeight: 800 }, children: "LOG" }), _jsx("span", { style: { fontSize: 12, fontWeight: 900, color: INK }, children: "\u3058\u3076\u3093\u306E \u7A4D\u307F\u4E0A\u3052" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginTop: 10 }, children: [_jsx(Mini, { label: "\u767B\u3063\u305F\u56DE\u6570", value: `${climbs.length}` }), _jsx(Mini, { label: "\u4ECA\u65E5", value: `${todayCount}` }), _jsx(Mini, { label: "\u81EA\u5DF1\u6700\u9AD8", value: floorName(sum.best, F) }), _jsx(Mini, { label: "\u6700\u9AD8\u3092\u66F4\u65B0", value: `${updates}回` })] }), _jsxs("svg", { viewBox: `0 0 ${W} ${H}`, style: { width: '100%', height: 'auto', marginTop: 10, display: 'block' }, role: "img", "aria-label": `極限の 到達段の うつりかわり（さいきん ${recent.length}回）`, children: [Array.from({ length: F + 1 }, (_, k) => (_jsx("line", { x1: P, x2: W - P, y1: y(k), y2: y(k), stroke: LINE, strokeWidth: k === F ? 1 : 0.5 }, k))), sum.sealed > 0 && (_jsx("line", { x1: P, x2: W - P, y1: y(sum.sealed), y2: y(sum.sealed), stroke: ORANGE, strokeWidth: 1.2, strokeDasharray: "4 3" })), _jsx("polyline", { points: pts, fill: "none", stroke: CYAN, strokeWidth: 2, strokeLinejoin: "round", style: { filter: `drop-shadow(0 0 3px ${CYAN})` } }), recent.map((r, i) => _jsx("circle", { cx: x(i), cy: y(r.floor), r: 2.6, fill: r.floor >= F ? ORANGE : CYAN }, r.eventId))] }), _jsxs("p", { style: { margin: '6px 0 0', fontSize: 10, color: DIM, fontWeight: 700 }, children: ["\u6C34\u8272\u306E\u7DDA\uFF1D\u6975\u9650\u3067\u5C4A\u3044\u305F\u6BB5\uFF08\u3055\u3044\u304D\u3093", recent.length, "\u56DE\uFF09\u3000\u30AA\u30EC\u30F3\u30B8\u306E\u70B9\u7DDA\uFF1D", SAVE_NAME, "\u3057\u305F\u6BB5"] })] }));
}
function Mini({ label, value }) {
    return (_jsxs("div", { style: { borderLeft: `2px solid ${CYAN}`, paddingLeft: 8 }, children: [_jsx("p", { style: { margin: 0, fontSize: 10, color: DIM, fontWeight: 800 }, children: label }), _jsx("p", { style: { margin: '2px 0 0', fontSize: 16, fontWeight: 900, color: INK, fontFamily: /\d/.test(value[0] ?? '') ? MONO : FONT }, children: value })] }));
}
function ModeButton({ code, title, sub, tone, disabled, onClick }) {
    return (_jsx("button", { type: "button", onClick: () => !disabled && onClick(), disabled: disabled, style: {
            width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16,
            cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: FONT, color: disabled ? FAINT : INK,
            border: `1px solid ${disabled ? 'rgba(232,251,255,0.12)' : tone}`,
            background: disabled ? 'rgba(1,3,7,0.6)' : `linear-gradient(90deg, ${tone}1f, rgba(1,3,7,0.7))`,
            boxShadow: disabled ? undefined : glow(`${tone}33`, 10),
        }, children: _jsxs("span", { style: { minWidth: 0 }, children: [_jsx("span", { style: { display: 'block', fontFamily: DISPLAY, fontSize: 10, letterSpacing: '0.35em', color: disabled ? FAINT : tone, fontWeight: 800 }, children: disabled ? `${code} ─ LOCKED` : code }), _jsx("span", { style: { display: 'block', fontSize: 24, fontWeight: 900, letterSpacing: '0.3em', marginTop: 2 }, children: title }), _jsx("span", { style: { display: 'block', fontSize: 12, fontWeight: 700, color: disabled ? FAINT : DIM, marginTop: 2 }, children: sub })] }) }));
}
function Rules() {
    const p = { margin: '4px 0 0' };
    return (_jsxs("div", { style: { marginTop: 22, fontSize: 11, lineHeight: 1.7, color: FAINT, fontWeight: 700 }, children: [_jsxs("p", { style: p, children: ["\u30FB\u5404\u6BB5 ", QUESTIONS_PER_FLOOR, "\u554F\u3002\u30CE\u30FC\u30DF\u30B9\u3067\u89E3\u3051\u305F\u554F\u984C\u3060\u3051\u304C \u6B63\u89E3\u3002\u540C\u3058\u6BB5\u3067 ", MISSES_TO_STOP, "\u56DE \u307E\u3061\u304C\u3048\u305F\u3089 \u305D\u3053\u3067\u6B62\u307E\u308B\u3002"] }), _jsx("p", { style: p, children: "\u30FB2\u6BB5\u3064\u3065\u3051\u3066 \u30CE\u30FC\u30DF\u30B9\u306A\u3089\u3001\u6B21\u306E\u6BB5\u3092 \u98DB\u3073\u3053\u3048\u308B\uFF08\u6700\u5F8C\u306E\u6BB5\u306F \u5FC5\u305A\u89E3\u304F\uFF09\u3002" }), _jsxs("p", { style: p, children: ["\u30FB\u305D\u306E\u6BB5\u307E\u3067 \u5C4A\u3044\u305F\u56DE\u304C \u901A\u7B97", SEAL_COUNT, "\u56DE\u306B \u306A\u308B\u3068\u300C", SAVE_NAME, "\u300D\u3002\u3072\u3068\u308A\u3067 \u6700\u5F8C\u307E\u3067 \u3084\u3063\u305F\u56DE\u3060\u3051 \u6570\u3048\u308B\u3002"] }), _jsxs("p", { style: p, children: ["\u30FB\u300C\u4ECA\u306E\u6BB5\u300D\u306F \u3044\u3061\u3070\u3093\u65B0\u3057\u3044\u7D50\u679C\u3002\u4E0B\u304C\u308B\u3053\u3068\u3082 \u3042\u308B\u3002", SAVE_NAME, "\u306F \u6D88\u3048\u306A\u3044\u3002"] })] }));
}
function Pips({ label, n, max, color }) {
    return (_jsx("span", { style: { display: 'flex', alignItems: 'center', gap: 4 }, title: label, "aria-label": `${label} ${n}/${max}`, children: Array.from({ length: max }, (_, i) => (_jsx("span", { style: { width: 10, height: 10, borderRadius: 2, background: i < n ? color : 'rgba(232,251,255,0.12)', boxShadow: i < n ? glow(`${color}66`, 5) : undefined } }, i))) }));
}
/** 登っている最中の進み。突破した段に光の尾がのびる */
function LightTrail({ climb, F }) {
    return (_jsx("div", { style: { maxWidth: 1024, margin: '10px auto 0', display: 'flex', gap: 3 }, children: Array.from({ length: F }, (_, i) => {
            const done = i < climb.cleared;
            const skipped = climb.skipped.includes(i);
            const here = i === climb.at;
            return (_jsx("div", { style: {
                    height: 4, flex: 1, borderRadius: 1,
                    background: done
                        ? (skipped ? ORANGE : `linear-gradient(90deg, ${CYAN}55, ${CYAN}, #ffffff, ${CYAN})`)
                        : here ? `${CYAN}44` : 'rgba(232,251,255,0.08)',
                    backgroundSize: done && !skipped ? '200px 100%' : undefined,
                    animation: done && !skipped ? 'lakTrail 1.6s linear infinite' : here ? 'lakPulse 1.2s ease-in-out infinite' : undefined,
                    boxShadow: done ? glow(skipped ? `${ORANGE}88` : `${CYAN}88`, 4) : undefined,
                } }, i));
        }) }));
}
function Result({ last, sum, prev, ctx, onPractice, onRetry }) {
    const { floors, testReqs, F } = ctx;
    const newSave = prev && sum.sealed > prev.sealed;
    const newBest = prev && last.mode === '極限' && last.floor > prev.best;
    const bigBtn = (bg, fg, border) => ({
        width: '100%', padding: '12px 0', borderRadius: 8, fontWeight: 900, fontSize: 15, cursor: 'pointer',
        background: bg, color: fg, border: border ?? 0, fontFamily: FONT,
    });
    const chip = (c, text) => (_jsx("p", { style: {
            display: 'inline-block', margin: '14px 6px 0', padding: '7px 16px', borderRadius: 4, animation: 'lakPop 300ms ease-out',
            border: `1px solid ${c}`, background: `${c}1f`, color: c, fontWeight: 900, boxShadow: glow(`${c}55`, 10),
        }, children: text }));
    if (last.mode === '無限') {
        const best = prev ? last.score > prev.endlessBest : true;
        return (_jsxs("div", { style: { textAlign: 'center', marginTop: 24 }, children: [_jsx("p", { style: { fontFamily: DISPLAY, fontSize: 11, letterSpacing: '0.45em', color: CYAN, fontWeight: 800, margin: 0 }, children: "INFINITY" }), _jsx("p", { style: { fontFamily: MONO, fontSize: 64, fontWeight: 900, margin: '12px 0 0', color: INK, textShadow: textGlow('rgba(34,231,255,0.55)') }, children: last.score }), _jsx("p", { style: { color: DIM, fontWeight: 700, margin: '8px 0 0' }, children: best ? '自己ベスト 更新！' : `自己ベスト ${sum.endlessBest}` }), _jsx("div", { style: { marginTop: 32 }, children: _jsx("button", { type: "button", onClick: onRetry, style: bigBtn(CYAN_SOFT, INK, `1px solid ${CYAN}`), children: "\u3082\u3046\u4E00\u5EA6 \u6311\u3080" }) })] }));
    }
    // 次にやるべき段＝止まった段。そこで出る項目の練習へ飛ばす
    const stuck = last.floor < F ? floors[last.floor] : null;
    const gain = nextGain(testReqs, sum.sealed, F);
    return (_jsxs("div", { style: { marginTop: 16 }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("p", { style: { fontFamily: DISPLAY, fontSize: 11, letterSpacing: '0.45em', color: CYAN, fontWeight: 800, margin: 0 }, children: "RESULT" }), _jsx("p", { style: { fontSize: 38, fontWeight: 900, margin: '12px 0 0', textShadow: textGlow('rgba(34,231,255,0.5)') }, children: last.floor >= F ? '頂点 到達' : last.floor === 0 ? '第1段で ストップ' : `第${last.floor}段 到達` }), last.floor !== 0 && (_jsx("p", { style: { color: DIM, fontWeight: 700, margin: '8px 0 0' }, children: last.floor >= F ? '全段を 突破した。無限が ひらく。' : `第${last.floor + 1}段で ストップ ── ここが 次に きたえる場所` })), newBest && chip(CYAN, '自己最高 更新！'), newSave && chip(ORANGE, `${floorName(sum.sealed, F)} を ${SAVE_NAME}した`)] }), _jsx("div", { style: { marginTop: 24 }, children: _jsx(Status, { sum: sum, ctx: ctx }) }), stuck && (_jsxs("div", { style: { marginTop: 22, borderRadius: 8, border: `1px solid ${CYAN}`, background: CYAN_SOFT, padding: 16, boxShadow: glow('rgba(34,231,255,0.18)', 10) }, children: [_jsxs("p", { style: { fontSize: 12, fontWeight: 900, color: CYAN, margin: 0 }, children: [_jsx("span", { style: { fontFamily: DISPLAY, letterSpacing: '0.25em', marginRight: 8, fontSize: 10 }, children: "NEXT" }), "\u3044\u307E \u3084\u308B\u3079\u304D\u3053\u3068"] }), _jsxs("p", { style: { fontSize: 18, fontWeight: 900, margin: '4px 0 0' }, children: ["\u7B2C", last.floor + 1, "\u6BB5\uFF1A", stuck.label] }), gain && _jsxs("p", { style: { fontSize: 12, color: DIM, fontWeight: 700, margin: '4px 0 0' }, children: [floorName(gain.floor, F), "\u3092 ", SAVE_NAME, "\u3059\u308B\u3068\u3001\u30C6\u30B9\u30C8\u4E88\u60F3\u304C +", gain.gain, "\u70B9"] }), onPractice && stuck.skills[0] && (_jsx("div", { style: { marginTop: 12 }, children: _jsx("button", { type: "button", onClick: () => onPractice(stuck.skills[0]), style: bigBtn(CYAN, BG), children: "\u3053\u306E\u6BB5\u306E \u308C\u3093\u3057\u3085\u3046\u3078" }) }))] })), _jsx("div", { style: { marginTop: 14 }, children: _jsx("button", { type: "button", onClick: onRetry, style: bigBtn('transparent', INK, `1px solid ${LINE}`), children: "\u3082\u3046\u4E00\u5EA6 \u767B\u308B" }) })] }));
}
/**
 * ハブに置く入口のカード。**ハブのいちばん下に置く**（毎日の練習の入口より目立たせない）。
 * 今の段とセーブを、端末の記録から出す。
 */
export function TrialCard({ appId, floors, onClick }) {
    useDisplayFont();
    const sum = useMemo(() => summarize(loadTrials(appId), floors), [appId, floors]);
    return (_jsxs("button", { type: "button", onClick: onClick, style: {
            width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: FONT, color: INK,
            borderRadius: 10, padding: '16px 18px', border: `1px solid ${CYAN}`,
            background: `linear-gradient(120deg, #06121c 0%, ${BG} 60%)`,
            boxShadow: glow('rgba(34,231,255,0.22)', 12), display: 'flex', alignItems: 'center', gap: 16,
        }, children: [_jsx(MiniStairs, { F: floors, reached: sum.best, saved: sum.sealed }), _jsxs("span", { style: { minWidth: 0, flex: 1 }, children: [_jsx("span", { style: { display: 'block', fontSize: 22, fontWeight: 900, letterSpacing: '0.06em', textShadow: textGlow('rgba(34,231,255,0.45)') }, children: TRIAL_NAME }), _jsx("span", { style: { display: 'block', fontFamily: DISPLAY, fontSize: 9, letterSpacing: '0.35em', color: CYAN, fontWeight: 800, marginTop: 2 }, children: TRIAL_SUBTITLE }), _jsx("span", { style: { display: 'block', fontSize: 12, color: DIM, fontWeight: 700, marginTop: 4 }, children: sum.runs === 0 ? '今の じぶんの 実力を、1段ずつ 確かめよう'
                            : `今の段 ${sum.current === null ? '—' : floorName(sum.current, floors)}　${SAVE_NAME} ${sum.sealed ? floorName(sum.sealed, floors) : 'なし'}` })] }), _jsx("span", { style: { fontSize: 22, color: CYAN }, children: "\u203A" })] }));
}
/** カードの左に置く小さな階段。届いた段は水色、セーブした段はオレンジ */
export function MiniStairs({ F, reached, saved, size = 52 }) {
    const n = Math.max(1, F);
    const s = size / n;
    return (_jsx("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, "aria-hidden": true, style: { flexShrink: 0 }, children: Array.from({ length: n }, (_, i) => {
            const c = saved >= i + 1 ? ORANGE : reached >= i + 1 ? CYAN : 'rgba(232,251,255,0.18)';
            return _jsx("rect", { x: i * s, y: size - (i + 1) * s, width: s - 1, height: (i + 1) * s, fill: `${c}33`, stroke: c, strokeWidth: 1 }, i);
        }) }));
}
//# sourceMappingURL=TrialScreen.js.map