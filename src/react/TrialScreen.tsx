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
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  startClimb, answerClimb, pickClimbSkill, startEndless, answerEndless, pickEndless,
  summarize, predictScore, nextGain, saveTrial, syncTrialsFromServer, flushTrials, loadTrials,
  floorName, NUMERALS, SEAL_COUNT, MISSES_TO_STOP, ENDLESS_MISSES, QUESTIONS_PER_FLOOR,
  type ClimbState, type EndlessState, type TrialRecord, type TrialFloorDef, type TestItemReq, type TrialSummary,
} from '../trial/index.js';
import { forceSolo } from '../sync/playMode.js';

const FONT = 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
const CYAN = '#67e8f9';
const FUCHSIA = '#f0abfc';
const GOLD = '#fde68a';
const DIM = 'rgba(255,255,255,0.55)';
const FAINT = 'rgba(255,255,255,0.35)';

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
  /** 層。やさしい順。skills はその層で出す項目の記号 */
  floors: readonly TrialFloorDef[];
  /** 本番テストの各設問が何層まで突破していれば取れるか（予想点に使う） */
  testReqs: readonly TestItemReq[];
  testMax: number;
  /** 1問を作る。問題が変わるたびに1回だけ呼ぶ */
  generate: (skillId: string, floor: number) => Q;
  /** 1問を出す。練習・本番テストと同じ解答画面を返す */
  render: (q: Q, h: TrialQuestionHandlers) => ReactNode;
  onExit: () => void;
  exitLabel?: string;
  /** 結果から「やるべき層」の練習へ飛ぶ。記号はその層の最初の項目 */
  onPractice?: (skillId: string) => void;
  sound?: { correct?: () => void; miss?: () => void; clear?: () => void };
}

type Phase = 'HOME' | 'CLIMB' | 'ENDLESS' | 'RESULT';
type Flash = { kind: 'ok' | 'ng' | 'clear'; text: string } | null;

const numeral = (i: number) => NUMERALS[i] ?? String(i + 1);

export function TrialScreen<Q>(props: TrialScreenProps<Q>) {
  const { appId, floors, testReqs, testMax, generate, render, onExit, exitLabel = 'もどる', onPractice, sound } = props;
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
      const n = pickEndless(s, floors);
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
        skipped ? { kind: 'clear', text: `第${numeral(climb.at)}層 突破 ── 第${numeral(next.skipped[next.skipped.length - 1]!)}層を 越えた` }
          : clearedNow ? { kind: 'clear', text: `第${numeral(climb.at)}層 突破` }
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
        const n = pickEndless(next, floors);
        ask(n.floor, n.skillId);
      }, 650);
    }
  };

  // 途中でやめた回は記録しない（刻印にも今の層にも数えない）
  const quit = () => { setPhase('HOME'); setClimb(null); setEndless(null); setQ(null); setFlash(null); };

  const ctx: Ctx = { floors, testReqs, testMax, F };

  if (phase === 'HOME') {
    return (
      <Shell onBack={onExit} backLabel={exitLabel}>
        <Title />
        <Status sum={sum} ctx={ctx} />
        <Tower sum={sum} ctx={ctx} />
        <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
          <ModeButton mark="▲" title="極限" tone={CYAN}
            sub="やさしい層から登り、どこまで確実にできるかを測る（10分ほど）" onClick={() => begin('極限')} />
          <ModeButton mark={sum.endlessUnlocked ? '∞' : '🔒'} title="無限" tone={FUCHSIA} disabled={!sum.endlessUnlocked}
            sub={sum.endlessUnlocked
              ? `まちがえるまで 挑み続ける（${ENDLESS_MISSES}回ミスで終了）　最高 ${sum.endlessBest}`
              : '極限で 神座に たどりつくと 解放される'}
            onClick={() => begin('無限')} />
        </div>
        <Rules />
      </Shell>
    );
  }

  if (phase === 'RESULT' && last) {
    return (
      <Shell onBack={() => setPhase('HOME')} backLabel="神域の試練へ">
        <Result last={last} sum={sum} prev={prev} ctx={ctx} onPractice={onPractice} onRetry={() => begin(last.mode)} />
      </Shell>
    );
  }

  const inClimb = phase === 'CLIMB' && climb;
  const fi = q?.floor ?? 0;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#04070f', color: '#fff', fontFamily: FONT }}>
      <style>{KEYFRAMES}</style>
      <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(7,11,22,0.92)', padding: '10px 14px' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={quit} style={btnGhost}>‹ やめる</button>
          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 900, letterSpacing: '0.2em', background: 'rgba(103,232,249,0.15)', color: '#cffafe', border: '1px solid rgba(103,232,249,0.3)' }}>
            {inClimb ? '極限' : '無限'}
          </span>
          <span style={{ fontWeight: 900, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#a5f3fc' }}>第{numeral(fi)}層</span>
            <span style={{ color: DIM, fontSize: 13, marginLeft: 8 }}>{floors[fi]?.label}</span>
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {inClimb ? (
              <>
                <Pips label="正解" n={climb.correct} max={QUESTIONS_PER_FLOOR} color={CYAN} />
                <Pips label="ミス" n={climb.misses} max={MISSES_TO_STOP} color="#fb7185" />
              </>
            ) : endless ? (
              <>
                <span style={{ fontWeight: 900, color: '#f5d0fe' }}>{endless.score}</span>
                <Pips label="ミス" n={endless.misses} max={ENDLESS_MISSES} color="#fb7185" />
              </>
            ) : null}
            <button type="button" onClick={() => settle(false)} style={{ ...btnGhost, border: '1px solid rgba(255,255,255,0.18)', fontSize: 12 }}>わからない</button>
          </span>
        </div>
        {inClimb && (
          <div style={{ maxWidth: 1024, margin: '8px auto 0', display: 'flex', gap: 4 }}>
            {floors.map((_, i) => (
              <div key={i} style={{
                height: 6, flex: 1, borderRadius: 999,
                background: i < climb.cleared ? (climb.skipped.includes(i) ? 'rgba(253,230,138,0.7)' : CYAN)
                  : i === climb.at ? 'rgba(103,232,249,0.4)' : 'rgba(255,255,255,0.1)',
              }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '20px 14px' }} key={q?.key}>
          {q && render(q.data, { onResult: (perfect) => settle(perfect), onMiss: () => settle(false) })}
        </div>
      </div>
      {flash && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{
            animation: 'lakTrialPop 180ms ease-out', padding: '14px 28px', borderRadius: 24, fontWeight: 900, fontSize: 26,
            ...(flash.kind === 'ng' ? { background: 'rgba(76,5,25,0.8)', color: '#fecdd3', border: '1px solid rgba(251,113,133,0.4)' }
              : flash.kind === 'ok' ? { background: 'rgba(8,51,68,0.8)', color: '#cffafe', border: '1px solid rgba(103,232,249,0.4)' }
                : { background: 'rgba(11,16,36,0.9)', color: '#fef3c7', border: '1px solid rgba(253,230,138,0.5)', boxShadow: '0 0 60px -10px rgba(253,230,138,0.6)' }),
          }}>{flash.text}</div>
        </div>
      )}
      {soloNotice && (
        <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 40, padding: '8px 16px', borderRadius: 12, background: '#0b1024', border: '1px solid rgba(103,232,249,0.4)', color: '#cffafe', fontSize: 14, fontWeight: 900 }}>
          試練は ひとりで。SOLO に きりかえたよ
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* 部品                                                                */
/* ================================================================== */

interface Ctx { floors: readonly TrialFloorDef[]; testReqs: readonly TestItemReq[]; testMax: number; F: number }

const KEYFRAMES = '@keyframes lakTrialPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}';

const btnGhost: CSSProperties = {
  background: 'transparent', border: 0, color: 'rgba(255,255,255,0.65)', fontWeight: 800,
  padding: '6px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: FONT, fontSize: 14,
};

function Shell({ onBack, backLabel, children }: { onBack: () => void; backLabel: string; children: ReactNode }) {
  return (
    <div style={{
      width: '100%', height: '100%', overflowY: 'auto', color: '#fff', fontFamily: FONT,
      background: 'radial-gradient(ellipse at top, #101a36 0%, #04070f 60%)',
    }}>
      <style>{KEYFRAMES}</style>
      <div style={{ maxWidth: 672, margin: '0 auto', padding: '20px 16px 40px' }}>
        <button type="button" onClick={onBack} style={{ ...btnGhost, fontSize: 15, marginBottom: 8 }}>‹ {backLabel}</button>
        {children}
      </div>
    </div>
  );
}

function Title() {
  return (
    <div style={{ textAlign: 'center', margin: '8px 0 24px' }}>
      <p style={{ fontSize: 11, letterSpacing: '0.5em', color: 'rgba(103,232,249,0.8)', fontWeight: 900, margin: 0 }}>SANCTUM TRIAL</p>
      <h1 style={{
        fontSize: 36, fontWeight: 900, margin: '8px 0 0',
        background: 'linear-gradient(to bottom, #fff, #a5f3fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
      }}>神域の試練</h1>
      <p style={{ color: DIM, fontWeight: 700, fontSize: 14, margin: '8px 0 0' }}>いまの 自分が、どの層まで 確実に 登れるか</p>
    </div>
  );
}

function Status({ sum, ctx }: { sum: TrialSummary; ctx: Ctx }) {
  const { testReqs, testMax, F } = ctx;
  const predicted = predictScore(testReqs, sum.sealed);   // 予想点は刻印（確かな力）で出す
  const today = sum.current ?? 0;
  const todayPred = predictScore(testReqs, today);
  const gain = nextGain(testReqs, sum.sealed, F);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
      <Stat label="今の層" value={sum.current === null ? '—' : floorName(sum.current, F)} sub="いちばん新しい 極限" />
      <Stat label="刻印" value={sum.sealed ? floorName(sum.sealed, F) : 'なし'} glow
        sub={sum.nextSeal ? `${floorName(sum.nextSeal.floor, F)}まで ${Math.min(sum.nextSeal.count, SEAL_COUNT)}/${SEAL_COUNT}` : '全層に刻印'} />
      <Stat label="テスト予想" value={`${predicted}`} unit={`/${testMax}`}
        sub={gain ? `${floorName(gain.floor, F)}に刻印で +${gain.gain}点` : 'これ以上は 上がらない'} />
      {sum.current !== null && todayPred !== predicted && (
        <p style={{ gridColumn: '1 / -1', fontSize: 11, color: DIM, fontWeight: 700, textAlign: 'center', margin: 0 }}>
          今日の結果（{floorName(today, F)}）なら {todayPred}点。刻印がそろうと 予想に入るよ
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, unit, sub, glow }: { label: string; value: string; unit?: string; sub?: string; glow?: boolean }) {
  return (
    <div style={{
      borderRadius: 16, padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
      border: glow ? '1px solid rgba(253,230,138,0.4)' : '1px solid rgba(255,255,255,0.1)',
      boxShadow: glow ? '0 0 30px -14px rgba(253,230,138,0.8)' : undefined,
    }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: DIM, fontWeight: 900, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 900, margin: '4px 0 0', lineHeight: 1.2 }}>
        {value}{unit && <span style={{ fontSize: 12, color: DIM, marginLeft: 2 }}>{unit}</span>}
      </p>
      {sub && <p style={{ fontSize: 10, color: DIM, fontWeight: 700, margin: '4px 0 0', lineHeight: 1.4 }}>{sub}</p>}
    </div>
  );
}

/** 塔。上が神座。刻印・ベスト・今の層に印を付ける */
function Tower({ sum, ctx }: { sum: TrialSummary; ctx: Ctx }) {
  const { floors, F } = ctx;
  const rows = [{ idx: F, name: '神座', label: '全層を 突破した者の 座' },
    ...floors.map((f, i) => ({ idx: i, name: `第${numeral(i)}層`, label: f.label })).reverse()];
  return (
    <div style={{ marginTop: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', padding: 10, display: 'grid', gap: 6 }}>
      {rows.map((r) => {
        const throne = r.idx === F;
        const need = throne ? F : r.idx + 1;
        const sealed = sum.sealed >= need;
        const best = sum.best >= need;
        // 「いま」は、いちばん新しい極限で突破した最も高い層（上の「今の層」と同じ層）
        const here = sum.current !== null && sum.current >= 1
          && (throne ? sum.current >= F : sum.current < F && sum.current - 1 === r.idx);
        return (
          <div key={r.name} style={{
            display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, padding: '7px 12px',
            border: `1px solid ${sealed ? 'rgba(253,230,138,0.5)' : best ? 'rgba(103,232,249,0.3)' : 'rgba(255,255,255,0.05)'}`,
            background: sealed ? 'rgba(254,243,199,0.06)' : best ? 'rgba(103,232,249,0.05)' : 'transparent',
          }}>
            <span style={{ width: 60, flexShrink: 0, fontWeight: 900, fontSize: 14, color: sealed ? '#fef3c7' : best ? '#a5f3fc' : FAINT }}>{r.name}</span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700, color: best ? 'rgba(255,255,255,0.8)' : FAINT }}>{r.label}</span>
            {sealed && <span style={{ fontSize: 10, fontWeight: 900, color: GOLD, letterSpacing: '0.15em' }}>✦刻印</span>}
            {here && <span style={{ fontSize: 10, fontWeight: 900, color: '#a5f3fc', letterSpacing: '0.15em' }}>⚑いま</span>}
          </div>
        );
      })}
    </div>
  );
}

function ModeButton({ mark, title, sub, tone, disabled, onClick }: {
  mark: string; title: string; sub: string; tone: string; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={() => !disabled && onClick()} disabled={disabled} style={{
      width: '100%', textAlign: 'left', padding: 16, borderRadius: 22, display: 'flex', alignItems: 'center', gap: 16,
      cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: FONT, color: disabled ? 'rgba(255,255,255,0.4)' : '#fff',
      border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : tone + '66'}`,
      background: disabled ? 'rgba(255,255,255,0.02)' : tone + '14',
      boxShadow: disabled ? undefined : `0 0 40px -18px ${tone}`,
    }}>
      <span style={{
        width: 48, height: 48, borderRadius: 16, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 22, fontWeight: 900,
        background: disabled ? 'rgba(255,255,255,0.05)' : tone + '26', color: disabled ? FAINT : tone,
      }}>{mark}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 24, fontWeight: 900, letterSpacing: '0.3em' }}>{title}</span>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, opacity: 0.7, marginTop: 2 }}>{sub}</span>
      </span>
    </button>
  );
}

function Rules() {
  const p: CSSProperties = { margin: '4px 0 0' };
  return (
    <div style={{ marginTop: 24, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
      <p style={p}>・各層 {QUESTIONS_PER_FLOOR}問。ノーミスで解けた問題だけが 正解。同じ層で {MISSES_TO_STOP}回 まちがえたら そこで止まる。</p>
      <p style={p}>・2層つづけて ノーミスなら、次の層を 飛びこえる（最後の層は 必ず解く）。</p>
      <p style={p}>・その層まで 届いた回が 通算{SEAL_COUNT}回に なると「刻印」。ひとりで 最後まで やった回だけ 数える。</p>
      <p style={p}>・「今の層」は いちばん新しい結果。下がることも ある。刻印は 消えない。</p>
    </div>
  );
}

function Pips({ label, n, max, color }: { label: string; n: number; max: number; color: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={label} aria-label={`${label} ${n}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ width: 10, height: 10, borderRadius: 999, background: i < n ? color : 'rgba(255,255,255,0.15)' }} />
      ))}
    </span>
  );
}

function Result({ last, sum, prev, ctx, onPractice, onRetry }: {
  last: TrialRecord; sum: TrialSummary; prev: TrialSummary | null; ctx: Ctx;
  onPractice?: (skillId: string) => void; onRetry: () => void;
}) {
  const { floors, testReqs, F } = ctx;
  const newSeal = prev && sum.sealed > prev.sealed;
  const bigBtn = (bg: string, fg: string, border?: string): CSSProperties => ({
    width: '100%', padding: '12px 0', borderRadius: 16, fontWeight: 900, fontSize: 15, cursor: 'pointer',
    background: bg, color: fg, border: border ?? 0, fontFamily: FONT,
  });
  if (last.mode === '無限') {
    const best = prev ? last.score > prev.endlessBest : true;
    return (
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.5em', color: 'rgba(240,171,252,0.8)', fontWeight: 900, margin: 0 }}>INFINITE</p>
        <p style={{ fontSize: 60, fontWeight: 900, margin: '12px 0 0' }}>{last.score}</p>
        <p style={{ color: DIM, fontWeight: 700, margin: '8px 0 0' }}>{best ? '自己ベスト 更新！' : `自己ベスト ${sum.endlessBest}`}</p>
        <div style={{ marginTop: 32 }}>
          <button type="button" onClick={onRetry} style={bigBtn('rgba(240,171,252,0.15)', '#fff', '1px solid rgba(240,171,252,0.4)')}>もう一度 挑む</button>
        </div>
      </div>
    );
  }
  // 次にやるべき層＝止まった層。そこで出る項目の練習へ飛ばす
  const stuck = last.floor < F ? floors[last.floor]! : null;
  const gain = nextGain(testReqs, sum.sealed, F);
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.5em', color: 'rgba(103,232,249,0.8)', fontWeight: 900, margin: 0 }}>RESULT</p>
        <p style={{ fontSize: 40, fontWeight: 900, margin: '12px 0 0' }}>
          {last.floor >= F ? '神座' : last.floor === 0 ? '第Ⅰ層で 止まった' : `第${numeral(last.floor - 1)}層 突破`}
        </p>
        {last.floor !== 0 && (
          <p style={{ color: DIM, fontWeight: 700, margin: '8px 0 0' }}>
            {last.floor >= F ? '全層を 突破した。無限が ひらく。' : `第${numeral(last.floor)}層で 止まった`}
          </p>
        )}
        {newSeal && (
          <p style={{
            display: 'inline-block', marginTop: 16, padding: '8px 16px', borderRadius: 999, animation: 'lakTrialPop 300ms ease-out',
            border: '1px solid rgba(253,230,138,0.6)', background: 'rgba(254,243,199,0.1)', color: '#fef3c7', fontWeight: 900,
            boxShadow: '0 0 40px -10px rgba(253,230,138,0.8)',
          }}>✦ {floorName(sum.sealed, F)} に 刻印</p>
        )}
      </div>
      <div style={{ marginTop: 24 }}><Status sum={sum} ctx={ctx} /></div>
      {stuck && (
        <div style={{ marginTop: 24, borderRadius: 22, border: '1px solid rgba(103,232,249,0.3)', background: 'rgba(103,232,249,0.06)', padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: '#a5f3fc', margin: 0 }}>◎ いま やるべきこと</p>
          <p style={{ fontSize: 18, fontWeight: 900, margin: '4px 0 0' }}>第{numeral(last.floor)}層：{stuck.label}</p>
          {gain && <p style={{ fontSize: 12, color: DIM, fontWeight: 700, margin: '4px 0 0' }}>{floorName(gain.floor, F)}に 刻印が そろうと、テスト予想が +{gain.gain}点</p>}
          {onPractice && stuck.skills[0] && (
            <div style={{ marginTop: 12 }}>
              <button type="button" onClick={() => onPractice(stuck.skills[0]!)} style={bigBtn(CYAN, '#04070f')}>この層の れんしゅうへ</button>
            </div>
          )}
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <button type="button" onClick={onRetry} style={bigBtn('transparent', '#fff', '1px solid rgba(255,255,255,0.18)')}>もう一度 登る</button>
      </div>
    </div>
  );
}

/**
 * ハブに置く入口のカード。**ハブのいちばん下に置く**（毎日の練習の入口より目立たせない）。
 * 今の層と刻印を、端末の記録から出す。
 */
export function TrialCard({ appId, floors, onClick }: { appId: string; floors: number; onClick: () => void }) {
  const sum = useMemo(() => summarize(loadTrials(appId), floors), [appId, floors]);
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: FONT, color: '#fff',
      borderRadius: 24, padding: '18px 20px', border: '1px solid rgba(103,232,249,0.35)',
      background: 'radial-gradient(ellipse at top left, #13214a 0%, #04070f 70%)',
      boxShadow: '0 0 50px -24px rgba(103,232,249,0.9)', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <span style={{ width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 24, background: 'rgba(103,232,249,0.15)', color: CYAN }}>▲</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 10, letterSpacing: '0.4em', color: 'rgba(103,232,249,0.8)', fontWeight: 900 }}>SANCTUM TRIAL</span>
        <span style={{ display: 'block', fontSize: 22, fontWeight: 900, marginTop: 2 }}>神域の試練</span>
        <span style={{ display: 'block', fontSize: 12, color: DIM, fontWeight: 700, marginTop: 2 }}>
          {sum.runs === 0 ? 'この単元を どこまで 確実に できるか 測ろう'
            : `今の層 ${sum.current === null ? '—' : floorName(sum.current, floors)}　刻印 ${sum.sealed ? floorName(sum.sealed, floors) : 'なし'}`}
        </span>
      </span>
      <span style={{ fontSize: 22, color: FAINT }}>›</span>
    </button>
  );
}
