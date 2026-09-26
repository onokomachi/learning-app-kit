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
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  startClimb, answerClimb, pickClimbSkill, startEndless, answerEndless, pickEndless,
  summarize, predictScore, nextGain, saveTrial, syncTrialsFromServer, flushTrials, loadTrials,
  floorName, TRIAL_NAME, TRIAL_SUBTITLE, SAVE_NAME,
  SEAL_COUNT, MISSES_TO_STOP, ENDLESS_MISSES, QUESTIONS_PER_FLOOR,
  type ClimbState, type EndlessState, type TrialRecord, type TrialFloorDef, type TestItemReq, type TrialSummary,
} from '../trial/index.js';
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

const glow = (c: string, r = 14) => `0 0 ${r}px ${c}, 0 0 ${r * 2}px ${c}55`;
const textGlow = (c: string) => `0 0 8px ${c}, 0 0 22px ${c}88`;

const KEYFRAMES = `
@keyframes lakPop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes lakPulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes lakTrail{from{background-position:0 0}to{background-position:200px 0}}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
`;

/** Orbitron を1回だけ読みこむ（英字の見出し用） */
function useDisplayFont() {
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById('lak-orbitron')) return;
    const l = document.createElement('link');
    l.id = 'lak-orbitron';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&display=swap';
    document.head.appendChild(l);
  }, []);
}

/* ---------------- 型 ---------------- */
export interface TrialQuestionHandlers {
  /** 解き終わったとき。perfect=ノーミス */
  onResult: (perfect: boolean) => void;
  /** 1回まちがえたとき（その時点で×にして次へ） */
  onMiss: () => void;
}

export interface TrialScreenProps<Q> {
  appId: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  /** 段。やさしい順。skills はその段で出す項目の記号。極限はこの範囲（＝本番テストの範囲） */
  floors: readonly TrialFloorDef[];
  /**
   * 無限で出す段。本番テストに出ない項目も入れる（withExtraSkills で作る）。省略すると floors。
   * generate / render は、ここに入れた項目も作れる・出せるようにしておく。
   */
  endlessFloors?: readonly TrialFloorDef[];
  /** 本番テストの各設問が何段まで突破していれば取れるか（予想点に使う） */
  testReqs: readonly TestItemReq[];
  testMax: number;
  /** 1問を作る。問題が変わるたびに1回だけ呼ぶ */
  generate: (skillId: string, floor: number) => Q;
  /** 1問を出す。練習・本番テストと同じ解答画面を返す */
  render: (q: Q, h: TrialQuestionHandlers) => ReactNode;
  onExit: () => void;
  exitLabel?: string;
  /** 結果から「やるべき段」の練習へ飛ぶ。記号はその段の最初の項目 */
  onPractice?: (skillId: string) => void;
  sound?: { correct?: () => void; miss?: () => void; clear?: () => void };
}

type Phase = 'HOME' | 'CLIMB' | 'ENDLESS' | 'RESULT';
type Flash = { kind: 'ok' | 'ng' | 'clear'; text: string } | null;

const stepName = (i: number, F: number) => (i >= F ? 'EXTRA' : `第${i + 1}段`);

/* ================================================================== */

export function TrialScreen<Q>(props: TrialScreenProps<Q>) {
  const { appId, floors, testReqs, testMax, generate, render, onExit, exitLabel = 'もどる', onPractice, sound } = props;
  const endlessFloors = props.endlessFloors ?? floors;
  useDisplayFont();
  const sync = useMemo(
    () => ({ appId, supabaseUrl: props.supabaseUrl, supabaseKey: props.supabaseKey }),
    [appId, props.supabaseUrl, props.supabaseKey],
  );
  const F = floors.length;
  const [records, setRecords] = useState<TrialRecord[]>(() => loadTrials(appId));
  const [phase, setPhase] = useState<Phase>('HOME');
  const [climb, setClimb] = useState<ClimbState | null>(null);
  const [endless, setEndless] = useState<EndlessState | null>(null);
  const [q, setQ] = useState<{ floor: number; skillId: string; data: Q; key: number } | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const [soloNotice, setSoloNotice] = useState(false);
  const [last, setLast] = useState<TrialRecord | null>(null);
  const [prev, setPrev] = useState<TrialSummary | null>(null);
  const locked = useRef(false);
  const keyRef = useRef(0);

  // 端末のデータが消えていても、学級コードがあればサーバから取り戻す
  useEffect(() => {
    void syncTrialsFromServer(sync).then(setRecords);
    void flushTrials(sync);
  }, [sync]);

  const sum = useMemo(() => summarize(records, F), [records, F]);

  const ask = (floor: number, skillId: string) => {
    keyRef.current += 1;
    locked.current = false;
    setQ({ floor, skillId, data: generate(skillId, floor), key: keyRef.current });
  };

  const begin = (mode: '極限' | '無限') => {
    if (forceSolo()) { setSoloNotice(true); setTimeout(() => setSoloNotice(false), 2600); }
    setPrev(sum); setFlash(null);
    if (mode === '極限') {
      const s = startClimb(F);
      setClimb(s); setEndless(null); setPhase('CLIMB');
      ask(0, pickClimbSkill(s, floors));
    } else {
      const s = startEndless();
      setEndless(s); setClimb(null); setPhase('ENDLESS');
      const n = pickEndless(s, endlessFloors);
      ask(n.floor, n.skillId);
    }
  };

  const finish = async (mode: '極限' | '無限', cleared: number, score: number) => {
    const rec = await saveTrial(sync, { mode, floor: cleared, floors: F, score, soloComplete: true });
    setLast(rec);
    setRecords(loadTrials(appId));
    setPhase('RESULT');
    if (mode === '極限' && cleared >= F) sound?.clear?.();
  };

  const settle = (correct: boolean) => {
    if (locked.current || !q) return;
    locked.current = true;
    (correct ? sound?.correct : sound?.miss)?.();

    if (phase === 'CLIMB' && climb) {
      const next = answerClimb(climb, q.skillId, correct);
      setClimb(next);
      const clearedNow = next.cleared > climb.cleared;
      const skipped = next.skipped.length > climb.skipped.length;
      setFlash(
        skipped ? { kind: 'clear', text: `第${climb.at + 1}段 突破 ── 第${next.skipped[next.skipped.length - 1]! + 1}段を 飛びこえた` }
          : clearedNow ? { kind: 'clear', text: `第${climb.at + 1}段 突破` }
            : { kind: correct ? 'ok' : 'ng', text: correct ? '正解' : 'ミス' },
      );
      setTimeout(() => {
        setFlash(null);
        if (next.done) { void finish('極限', next.cleared, 0); return; }
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
        if (next.done) { void finish('無限', F, next.score); return; }
        const n = pickEndless(next, endlessFloors);
        ask(n.floor, n.skillId);
      }, 650);
    }
  };

  // 途中でやめた回は記録しない（セーブにも今の段にも数えない）
  const quit = () => { setPhase('HOME'); setClimb(null); setEndless(null); setQ(null); setFlash(null); };

  const ctx: Ctx = { floors, testReqs, testMax, F };

  if (phase === 'HOME') {
    return (
      <Shell onBack={onExit} backLabel={exitLabel}>
        <Title />
        <Status sum={sum} ctx={ctx} />
        <Stairs sum={sum} ctx={ctx} />
        <Effort records={records} sum={sum} F={F} />
        <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
          <ModeButton code="LIMIT" title="極限" tone={CYAN}
            sub="やさしい段から登り、どこまで確実にできるかを測る（10分ほど）" onClick={() => begin('極限')} />
          <ModeButton code="INFINITY" title="無限" tone={CYAN} disabled={!sum.endlessUnlocked}
            sub={sum.endlessUnlocked
              ? `単元の すべての項目で、まちがえるまで挑み続ける（${ENDLESS_MISSES}回ミスで終了）　最高 ${sum.endlessBest}`
              : '極限で 頂点に たどりつくと 解放される'}
            onClick={() => begin('無限')} />
        </div>
        <Rules />
      </Shell>
    );
  }

  if (phase === 'RESULT' && last) {
    return (
      <Shell onBack={() => setPhase('HOME')} backLabel={`${TRIAL_NAME}へ`}>
        <Result last={last} sum={sum} prev={prev} ctx={ctx} onPractice={onPractice} onRetry={() => begin(last.mode)} />
      </Shell>
    );
  }

  const inClimb = phase === 'CLIMB' && climb;
  const fi = q?.floor ?? 0;
  const fl = inClimb ? floors[fi] : endlessFloors[fi];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: BG, color: INK, fontFamily: FONT, position: 'relative' }}>
      <style>{KEYFRAMES}</style>
      <Grid />
      <div style={{ position: 'relative', flexShrink: 0, borderBottom: `1px solid ${LINE}`, background: 'rgba(1,3,7,0.9)', padding: '10px 14px 12px' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={quit} style={btnGhost}>‹ やめる</button>
          <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 900, letterSpacing: '0.2em', color: CYAN, border: `1px solid ${CYAN}`, boxShadow: glow(CYAN_SOFT, 8) }}>
            {inClimb ? '極限' : '無限'}
          </span>
          <span style={{ fontWeight: 900, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: CYAN, textShadow: textGlow(CYAN_SOFT) }}>{stepName(fi, F)}</span>
            <span style={{ color: DIM, fontSize: 13, marginLeft: 8 }}>{fl?.label}</span>
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {inClimb ? (
              <>
                <Pips label="正解" n={climb.correct} max={QUESTIONS_PER_FLOOR} color={CYAN} />
                <Pips label="ミス" n={climb.misses} max={MISSES_TO_STOP} color={RED} />
              </>
            ) : endless ? (
              <>
                <span style={{ fontFamily: MONO, fontWeight: 900, color: CYAN, fontSize: 18 }}>{endless.score}</span>
                <Pips label="ミス" n={endless.misses} max={ENDLESS_MISSES} color={RED} />
              </>
            ) : null}
            <button type="button" onClick={() => settle(false)} style={{ ...btnGhost, border: `1px solid ${LINE}`, fontSize: 12 }}>わからない</button>
          </span>
        </div>
        {inClimb && <LightTrail climb={climb} F={F} />}
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '20px 14px' }} key={q?.key}>
          {q && render(q.data, { onResult: (perfect) => settle(perfect), onMiss: () => settle(false) })}
        </div>
      </div>
      {flash && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{
            animation: 'lakPop 180ms ease-out', padding: '14px 30px', borderRadius: 8, fontWeight: 900, fontSize: 26,
            background: 'rgba(1,3,7,0.9)',
            ...(flash.kind === 'ng' ? { color: '#ffd0da', border: `1px solid ${RED}`, boxShadow: glow('rgba(255,85,119,0.35)') }
              : flash.kind === 'ok' ? { color: INK, border: `1px solid ${CYAN}`, boxShadow: glow(CYAN_SOFT) }
                : { color: CYAN, border: `1px solid ${CYAN}`, boxShadow: glow('rgba(34,231,255,0.45)', 24), textShadow: textGlow(CYAN_SOFT) }),
          }}>{flash.text}</div>
        </div>
      )}
      {soloNotice && (
        <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 40, padding: '8px 16px', borderRadius: 6, background: BG, border: `1px solid ${CYAN}`, color: INK, fontSize: 14, fontWeight: 900, boxShadow: glow(CYAN_SOFT) }}>
          実力の階段は ひとりで。SOLO に きりかえたよ
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* 部品                                                                */
/* ================================================================== */

interface Ctx { floors: readonly TrialFloorDef[]; testReqs: readonly TestItemReq[]; testMax: number; F: number }

const btnGhost: CSSProperties = {
  background: 'transparent', border: 0, color: DIM, fontWeight: 800,
  padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT, fontSize: 14,
};

/** 奥へのびるグリッドの床（トロンの地面） */
function Grid() {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', left: '-50%', right: '-50%', bottom: '-10%', height: '60%',
        backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        transform: 'perspective(420px) rotateX(62deg)', transformOrigin: 'bottom',
        maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
        opacity: 0.55,
      }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 220, background: `radial-gradient(ellipse at top, rgba(34,231,255,0.10), transparent 70%)` }} />
    </div>
  );
}

function Shell({ onBack, backLabel, children }: { onBack: () => void; backLabel: string; children: ReactNode }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflowY: 'auto', color: INK, fontFamily: FONT, background: BG }}>
      <style>{KEYFRAMES}</style>
      <Grid />
      <div style={{ position: 'relative', maxWidth: 672, margin: '0 auto', padding: '18px 16px 48px' }}>
        <button type="button" onClick={onBack} style={{ ...btnGhost, fontSize: 15, marginBottom: 6 }}>‹ {backLabel}</button>
        {children}
      </div>
    </div>
  );
}

function Title() {
  return (
    <div style={{ textAlign: 'center', margin: '6px 0 22px' }}>
      <h1 style={{ fontSize: 38, fontWeight: 900, margin: 0, letterSpacing: '0.08em', color: INK, textShadow: textGlow('rgba(34,231,255,0.55)') }}>
        {TRIAL_NAME}
      </h1>
      <p style={{ fontFamily: DISPLAY, fontSize: 11, fontWeight: 800, letterSpacing: '0.38em', color: CYAN, margin: '8px 0 0', opacity: 0.9 }}>
        {TRIAL_SUBTITLE}
      </p>
      <div style={{ margin: '14px auto 0', width: 160, height: 1, background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`, boxShadow: glow(CYAN_SOFT, 6) }} />
    </div>
  );
}

function Status({ sum, ctx }: { sum: TrialSummary; ctx: Ctx }) {
  const { testReqs, testMax, F } = ctx;
  const predicted = predictScore(testReqs, sum.sealed);   // 予想点はセーブ（確かな力）で出す
  const today = sum.current ?? 0;
  const todayPred = predictScore(testReqs, today);
  const gain = nextGain(testReqs, sum.sealed, F);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
      <Stat code="NOW" label="今の段" value={sum.current === null ? '—' : floorName(sum.current, F)} sub="いちばん新しい 極限" color={CYAN} />
      <Stat code="SAVE" label={SAVE_NAME} value={sum.sealed ? floorName(sum.sealed, F) : 'なし'} color={ORANGE}
        sub={sum.nextSeal ? `${floorName(sum.nextSeal.floor, F)}まで ${Math.min(sum.nextSeal.count, SEAL_COUNT)}/${SEAL_COUNT}` : '頂点を セーブ済み'} />
      <Stat code="SCORE" label="テスト予想" value={`${predicted}`} unit={`/${testMax}`} color={CYAN}
        sub={gain ? `${floorName(gain.floor, F)}を セーブで +${gain.gain}点` : 'これ以上は 上がらない'} />
      {sum.current !== null && todayPred !== predicted && (
        <p style={{ gridColumn: '1 / -1', fontSize: 11, color: DIM, fontWeight: 700, textAlign: 'center', margin: 0 }}>
          今日の結果（{floorName(today, F)}）なら {todayPred}点。{SAVE_NAME}されると 予想に入るよ
        </p>
      )}
    </div>
  );
}

function Stat({ code, label, value, unit, sub, color }: { code: string; label: string; value: string; unit?: string; sub?: string; color: string }) {
  return (
    <div style={{
      borderRadius: 6, padding: '10px 12px', background: 'rgba(1,3,7,0.72)',
      border: `1px solid ${color}66`, boxShadow: `inset 0 0 18px ${color}14`,
    }}>
      <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 9, letterSpacing: '0.25em', color, fontWeight: 800 }}>{code}</span>
        <span style={{ fontSize: 10, color: DIM, fontWeight: 800 }}>{label}</span>
      </p>
      <p style={{ fontSize: 19, fontWeight: 900, margin: '4px 0 0', lineHeight: 1.2, color: INK }}>
        {value}{unit && <span style={{ fontSize: 12, color: DIM, marginLeft: 2, fontFamily: MONO }}>{unit}</span>}
      </p>
      {sub && <p style={{ fontSize: 10, color: DIM, fontWeight: 700, margin: '4px 0 0', lineHeight: 1.4 }}>{sub}</p>}
    </div>
  );
}

/**
 * 光る階段。右上へのぼっていく。いちばん上が頂点。
 * 水色＝届いたことがある段、オレンジ＝セーブした段、脈打つ印＝今の段。
 */
function Stairs({ sum, ctx }: { sum: TrialSummary; ctx: Ctx }) {
  const { floors, F } = ctx;
  const rows = [{ idx: F, name: '頂点', label: '全段を 突破した者だけが 立てる場所' },
    ...floors.map((f, i) => ({ idx: i, name: `第${i + 1}段`, label: f.label })).reverse()];
  const n = rows.length;
  return (
    <div style={{ marginTop: 22, padding: '14px 10px 10px', borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(1,3,7,0.6)' }}>
      {rows.map((r, row) => {
        const top = r.idx === F;
        const need = top ? F : r.idx + 1;
        const saved = sum.sealed >= need;
        const reached = sum.best >= need;
        const here = sum.current !== null && sum.current >= 1
          && (top ? sum.current >= F : sum.current < F && sum.current - 1 === r.idx);
        // 下の段ほど左、上の段ほど右から始めて「右上へのぼる」形にする
        const shift = (row / Math.max(1, n - 1)) * 34;
        const color = saved ? ORANGE : reached ? CYAN : FAINT;
        return (
          <div key={r.name} style={{
            display: 'flex', alignItems: 'center', gap: 10, marginLeft: `${34 - shift}%`,
            padding: '7px 10px', marginBottom: 4,
            borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`,
            boxShadow: saved || reached ? `0 6px 14px -8px ${color}` : undefined,
            background: saved ? ORANGE_SOFT : reached ? CYAN_SOFT : 'transparent',
          }}>
            <span style={{ width: 56, flexShrink: 0, fontWeight: 900, fontSize: 13, color, textShadow: saved || reached ? textGlow(`${color}55`) : undefined }}>{r.name}</span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 700, color: reached ? DIM : FAINT }}>{r.label}</span>
            {saved && <span style={{ fontFamily: DISPLAY, fontSize: 9, fontWeight: 800, color: ORANGE, letterSpacing: '0.2em' }}>SAVE</span>}
            {here && <span style={{ fontSize: 10, fontWeight: 900, color: CYAN, letterSpacing: '0.1em', animation: 'lakPulse 1.4s ease-in-out infinite' }}>▶いま</span>}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 努力と伸びの見える化。数えるのは自分の記録だけ（他の子とは比べない）。
 *   挑戦した回数・今日の回数・自己最高・無限の最高と、極限の1回ごとの到達段の折れ線。
 */
function Effort({ records, sum, F }: { records: readonly TrialRecord[]; sum: TrialSummary; F: number }) {
  const climbs = records.filter((r) => r.mode === '極限').sort((a, b) => a.ts - b.ts);
  if (climbs.length === 0) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayCount = climbs.filter((r) => r.ts >= today.getTime()).length;
  // 自己最高を更新した回（はじめて その段以上に届いた回）
  let best = 0; let updates = 0;
  for (const r of climbs) if (r.floor > best) { best = r.floor; updates++; }
  const recent = climbs.slice(-20);
  const W = 300; const H = 90; const P = 8;
  const x = (i: number) => P + (recent.length === 1 ? (W - 2 * P) / 2 : (i / (recent.length - 1)) * (W - 2 * P));
  const y = (v: number) => H - P - (v / Math.max(1, F)) * (H - 2 * P);
  const pts = recent.map((r, i) => `${x(i)},${y(r.floor)}`).join(' ');
  return (
    <div style={{ marginTop: 18, borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(1,3,7,0.6)', padding: 14 }}>
      <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 9, letterSpacing: '0.3em', color: CYAN, fontWeight: 800 }}>LOG</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: INK }}>じぶんの 積み上げ</span>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginTop: 10 }}>
        <Mini label="登った回数" value={`${climbs.length}`} />
        <Mini label="今日" value={`${todayCount}`} />
        <Mini label="自己最高" value={floorName(sum.best, F)} />
        <Mini label="最高を更新" value={`${updates}回`} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', marginTop: 10, display: 'block' }} role="img"
        aria-label={`極限の 到達段の うつりかわり（さいきん ${recent.length}回）`}>
        {Array.from({ length: F + 1 }, (_, k) => (
          <line key={k} x1={P} x2={W - P} y1={y(k)} y2={y(k)} stroke={LINE} strokeWidth={k === F ? 1 : 0.5} />
        ))}
        {sum.sealed > 0 && (
          <line x1={P} x2={W - P} y1={y(sum.sealed)} y2={y(sum.sealed)} stroke={ORANGE} strokeWidth={1.2} strokeDasharray="4 3" />
        )}
        <polyline points={pts} fill="none" stroke={CYAN} strokeWidth={2} strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 3px ${CYAN})` }} />
        {recent.map((r, i) => <circle key={r.eventId} cx={x(i)} cy={y(r.floor)} r={2.6} fill={r.floor >= F ? ORANGE : CYAN} />)}
      </svg>
      <p style={{ margin: '6px 0 0', fontSize: 10, color: DIM, fontWeight: 700 }}>
        水色の線＝極限で届いた段（さいきん{recent.length}回）　オレンジの点線＝{SAVE_NAME}した段
      </p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderLeft: `2px solid ${CYAN}`, paddingLeft: 8 }}>
      <p style={{ margin: 0, fontSize: 10, color: DIM, fontWeight: 800 }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 900, color: INK, fontFamily: /\d/.test(value[0] ?? '') ? MONO : FONT }}>{value}</p>
    </div>
  );
}

function ModeButton({ code, title, sub, tone, disabled, onClick }: {
  code: string; title: string; sub: string; tone: string; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={() => !disabled && onClick()} disabled={disabled} style={{
      width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16,
      cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: FONT, color: disabled ? FAINT : INK,
      border: `1px solid ${disabled ? 'rgba(232,251,255,0.12)' : tone}`,
      background: disabled ? 'rgba(1,3,7,0.6)' : `linear-gradient(90deg, ${tone}1f, rgba(1,3,7,0.7))`,
      boxShadow: disabled ? undefined : glow(`${tone}33`, 10),
    }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: DISPLAY, fontSize: 10, letterSpacing: '0.35em', color: disabled ? FAINT : tone, fontWeight: 800 }}>
          {disabled ? `${code} ─ LOCKED` : code}
        </span>
        <span style={{ display: 'block', fontSize: 24, fontWeight: 900, letterSpacing: '0.3em', marginTop: 2 }}>{title}</span>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: disabled ? FAINT : DIM, marginTop: 2 }}>{sub}</span>
      </span>
    </button>
  );
}

function Rules() {
  const p: CSSProperties = { margin: '4px 0 0' };
  return (
    <div style={{ marginTop: 22, fontSize: 11, lineHeight: 1.7, color: FAINT, fontWeight: 700 }}>
      <p style={p}>・各段 {QUESTIONS_PER_FLOOR}問。ノーミスで解けた問題だけが 正解。同じ段で {MISSES_TO_STOP}回 まちがえたら そこで止まる。</p>
      <p style={p}>・2段つづけて ノーミスなら、次の段を 飛びこえる（最後の段は 必ず解く）。</p>
      <p style={p}>・その段まで 届いた回が 通算{SEAL_COUNT}回に なると「{SAVE_NAME}」。ひとりで 最後まで やった回だけ 数える。</p>
      <p style={p}>・「今の段」は いちばん新しい結果。下がることも ある。{SAVE_NAME}は 消えない。</p>
    </div>
  );
}

function Pips({ label, n, max, color }: { label: string; n: number; max: number; color: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={label} aria-label={`${label} ${n}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ width: 10, height: 10, borderRadius: 2, background: i < n ? color : 'rgba(232,251,255,0.12)', boxShadow: i < n ? glow(`${color}66`, 5) : undefined }} />
      ))}
    </span>
  );
}

/** 登っている最中の進み。突破した段に光の尾がのびる */
function LightTrail({ climb, F }: { climb: ClimbState; F: number }) {
  return (
    <div style={{ maxWidth: 1024, margin: '10px auto 0', display: 'flex', gap: 3 }}>
      {Array.from({ length: F }, (_, i) => {
        const done = i < climb.cleared;
        const skipped = climb.skipped.includes(i);
        const here = i === climb.at;
        return (
          <div key={i} style={{
            height: 4, flex: 1, borderRadius: 1,
            background: done
              ? (skipped ? ORANGE : `linear-gradient(90deg, ${CYAN}55, ${CYAN}, #ffffff, ${CYAN})`)
              : here ? `${CYAN}44` : 'rgba(232,251,255,0.08)',
            backgroundSize: done && !skipped ? '200px 100%' : undefined,
            animation: done && !skipped ? 'lakTrail 1.6s linear infinite' : here ? 'lakPulse 1.2s ease-in-out infinite' : undefined,
            boxShadow: done ? glow(skipped ? `${ORANGE}88` : `${CYAN}88`, 4) : undefined,
          }} />
        );
      })}
    </div>
  );
}

function Result({ last, sum, prev, ctx, onPractice, onRetry }: {
  last: TrialRecord; sum: TrialSummary; prev: TrialSummary | null; ctx: Ctx;
  onPractice?: (skillId: string) => void; onRetry: () => void;
}) {
  const { floors, testReqs, F } = ctx;
  const newSave = prev && sum.sealed > prev.sealed;
  const newBest = prev && last.mode === '極限' && last.floor > prev.best;
  const bigBtn = (bg: string, fg: string, border?: string): CSSProperties => ({
    width: '100%', padding: '12px 0', borderRadius: 8, fontWeight: 900, fontSize: 15, cursor: 'pointer',
    background: bg, color: fg, border: border ?? 0, fontFamily: FONT,
  });
  const chip = (c: string, text: string) => (
    <p style={{
      display: 'inline-block', margin: '14px 6px 0', padding: '7px 16px', borderRadius: 4, animation: 'lakPop 300ms ease-out',
      border: `1px solid ${c}`, background: `${c}1f`, color: c, fontWeight: 900, boxShadow: glow(`${c}55`, 10),
    }}>{text}</p>
  );
  if (last.mode === '無限') {
    const best = prev ? last.score > prev.endlessBest : true;
    return (
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <p style={{ fontFamily: DISPLAY, fontSize: 11, letterSpacing: '0.45em', color: CYAN, fontWeight: 800, margin: 0 }}>INFINITY</p>
        <p style={{ fontFamily: MONO, fontSize: 64, fontWeight: 900, margin: '12px 0 0', color: INK, textShadow: textGlow('rgba(34,231,255,0.55)') }}>{last.score}</p>
        <p style={{ color: DIM, fontWeight: 700, margin: '8px 0 0' }}>{best ? '自己ベスト 更新！' : `自己ベスト ${sum.endlessBest}`}</p>
        <div style={{ marginTop: 32 }}>
          <button type="button" onClick={onRetry} style={bigBtn(CYAN_SOFT, INK, `1px solid ${CYAN}`)}>もう一度 挑む</button>
        </div>
      </div>
    );
  }
  // 次にやるべき段＝止まった段。そこで出る項目の練習へ飛ばす
  const stuck = last.floor < F ? floors[last.floor]! : null;
  const gain = nextGain(testReqs, sum.sealed, F);
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: DISPLAY, fontSize: 11, letterSpacing: '0.45em', color: CYAN, fontWeight: 800, margin: 0 }}>RESULT</p>
        <p style={{ fontSize: 38, fontWeight: 900, margin: '12px 0 0', textShadow: textGlow('rgba(34,231,255,0.5)') }}>
          {last.floor >= F ? '頂点 到達' : last.floor === 0 ? '第1段で ストップ' : `第${last.floor}段 到達`}
        </p>
        {last.floor !== 0 && (
          <p style={{ color: DIM, fontWeight: 700, margin: '8px 0 0' }}>
            {last.floor >= F ? '全段を 突破した。無限が ひらく。' : `第${last.floor + 1}段で ストップ ── ここが 次に きたえる場所`}
          </p>
        )}
        {newBest && chip(CYAN, '自己最高 更新！')}
        {newSave && chip(ORANGE, `${floorName(sum.sealed, F)} を ${SAVE_NAME}した`)}
      </div>
      <div style={{ marginTop: 24 }}><Status sum={sum} ctx={ctx} /></div>
      {stuck && (
        <div style={{ marginTop: 22, borderRadius: 8, border: `1px solid ${CYAN}`, background: CYAN_SOFT, padding: 16, boxShadow: glow('rgba(34,231,255,0.18)', 10) }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: CYAN, margin: 0 }}>
            <span style={{ fontFamily: DISPLAY, letterSpacing: '0.25em', marginRight: 8, fontSize: 10 }}>NEXT</span>いま やるべきこと
          </p>
          <p style={{ fontSize: 18, fontWeight: 900, margin: '4px 0 0' }}>第{last.floor + 1}段：{stuck.label}</p>
          {gain && <p style={{ fontSize: 12, color: DIM, fontWeight: 700, margin: '4px 0 0' }}>{floorName(gain.floor, F)}を {SAVE_NAME}すると、テスト予想が +{gain.gain}点</p>}
          {onPractice && stuck.skills[0] && (
            <div style={{ marginTop: 12 }}>
              <button type="button" onClick={() => onPractice(stuck.skills[0]!)} style={bigBtn(CYAN, BG)}>この段の れんしゅうへ</button>
            </div>
          )}
        </div>
      )}
      <div style={{ marginTop: 14 }}>
        <button type="button" onClick={onRetry} style={bigBtn('transparent', INK, `1px solid ${LINE}`)}>もう一度 登る</button>
      </div>
    </div>
  );
}

/**
 * ハブに置く入口のカード。**ハブのいちばん下に置く**（毎日の練習の入口より目立たせない）。
 * 今の段とセーブを、端末の記録から出す。
 */
export function TrialCard({ appId, floors, onClick }: { appId: string; floors: number; onClick: () => void }) {
  useDisplayFont();
  const sum = useMemo(() => summarize(loadTrials(appId), floors), [appId, floors]);
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: FONT, color: INK,
      borderRadius: 10, padding: '16px 18px', border: `1px solid ${CYAN}`,
      background: `linear-gradient(120deg, #06121c 0%, ${BG} 60%)`,
      boxShadow: glow('rgba(34,231,255,0.22)', 12), display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <MiniStairs F={floors} reached={sum.best} saved={sum.sealed} />
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 22, fontWeight: 900, letterSpacing: '0.06em', textShadow: textGlow('rgba(34,231,255,0.45)') }}>{TRIAL_NAME}</span>
        <span style={{ display: 'block', fontFamily: DISPLAY, fontSize: 9, letterSpacing: '0.35em', color: CYAN, fontWeight: 800, marginTop: 2 }}>{TRIAL_SUBTITLE}</span>
        <span style={{ display: 'block', fontSize: 12, color: DIM, fontWeight: 700, marginTop: 4 }}>
          {sum.runs === 0 ? '今の じぶんの 実力を、1段ずつ 確かめよう'
            : `今の段 ${sum.current === null ? '—' : floorName(sum.current, floors)}　${SAVE_NAME} ${sum.sealed ? floorName(sum.sealed, floors) : 'なし'}`}
        </span>
      </span>
      <span style={{ fontSize: 22, color: CYAN }}>›</span>
    </button>
  );
}

/** カードの左に置く小さな階段。届いた段は水色、セーブした段はオレンジ */
export function MiniStairs({ F, reached, saved, size = 52 }: { F: number; reached: number; saved: number; size?: number }) {
  const n = Math.max(1, F);
  const s = size / n;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ flexShrink: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const c = saved >= i + 1 ? ORANGE : reached >= i + 1 ? CYAN : 'rgba(232,251,255,0.18)';
        return <rect key={i} x={i * s} y={size - (i + 1) * s} width={s - 1} height={(i + 1) * s} fill={`${c}33`} stroke={c} strokeWidth={1} />;
      })}
    </svg>
  );
}
