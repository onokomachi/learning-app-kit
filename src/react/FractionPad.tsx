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
import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  toInt, toInt0, multiplesOf, sharedCircled, scaleFactor, applyDivisor, reduceChain, borrowOne, divCheck,
} from './fractionPadLogic.js';

export type FractionTool = 'multiples' | 'common' | 'reduce' | 'convert' | 'borrow';

export interface FractionPadProps {
  /** 使う道具。先頭が、開いたときに選ばれている道具。省略すると ぜんぶ */
  tools?: FractionTool[];
  /**
   * 数が問題文にそのまま書いてある場面だけ、はじめから入れておく（式を立てる前の文章題では渡さない）。
   *   multiples … 倍数を ならべる 2つの数
   *   fractions … 通分する分数（2〜3つ）。約分の道具には先頭の1つが入る
   *   mixed     … 帯分数（整数・分子・分母）。仮分数・くり下げの道具に入る
   */
  initial?: {
    tool?: FractionTool;
    multiples?: [number, number];
    fractions?: [number, number][];
    mixed?: { w: number; n: number; d: number };
  };
}

const INK = '#0f2540';
const RED = '#e11d48';
const AMBER = '#b45309';
const BLUE = '#0369a1';
const FONT = 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';

const TOOL_LABEL: Record<FractionTool, string> = {
  multiples: '倍数を ならべる', common: '通分', reduce: '約分', convert: '仮分数・帯分数', borrow: 'くり下げ',
};
const ALL_TOOLS: FractionTool[] = ['multiples', 'common', 'reduce', 'convert', 'borrow'];

const S = {
  wrap: {
    borderRadius: 18, border: '2px dashed #bcd3ec', background: '#f7fbff',
    padding: 14, marginTop: 10, marginBottom: 10, fontFamily: FONT, color: INK, textAlign: 'left',
  } as CSSProperties,
  head: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' } as CSSProperties,
  title: { fontSize: 12, fontWeight: 800, color: '#2f4d75', margin: 0 } as CSSProperties,
  tab: (on: boolean): CSSProperties => ({
    border: 0, borderRadius: 10, cursor: 'pointer', fontWeight: 900, fontSize: 13,
    padding: '6px 11px', background: on ? '#0ea5e9' : '#e8eff8', color: on ? '#fff' : '#54637a',
  }),
  box: (on: boolean, w: number): CSSProperties => ({
    minWidth: w, height: 40, padding: '0 8px', borderRadius: 8, cursor: 'pointer', boxSizing: 'border-box',
    display: 'inline-grid', placeItems: 'center', fontSize: 21, fontWeight: 900, color: INK,
    background: on ? '#e0f2fe' : '#fff', border: on ? '2px solid #0ea5e9' : '1px solid #cfdcec', letterSpacing: 1,
  }),
  key: {
    minWidth: 42, height: 40, borderRadius: 8, border: '1px solid #cfdcec', background: '#f2f7fd',
    fontSize: 17, fontWeight: 800, color: '#2f4d75', cursor: 'pointer', padding: '0 8px',
  } as CSSProperties,
  ghost: {
    border: '1px solid #dbe4f0', borderRadius: 10, background: '#fff',
    color: '#64748b', fontWeight: 800, fontSize: 12, padding: '6px 12px', cursor: 'pointer',
  } as CSSProperties,
  tool: (on = false): CSSProperties => ({
    border: on ? `2px solid ${RED}` : '1px solid #bcd3ec', borderRadius: 10,
    background: on ? '#fff1f2' : '#fff', color: on ? RED : BLUE,
    fontWeight: 900, fontSize: 14, padding: '7px 12px', cursor: 'pointer',
  }),
  label: { fontSize: 11, color: '#8496ad', fontWeight: 700, margin: '0 0 4px' } as CSSProperties,
  msg: { fontSize: 12, color: RED, fontWeight: 800, margin: '8px 0 0' } as CSSProperties,
  note: { fontSize: 11, color: '#8496ad', marginTop: 10, marginBottom: 0, lineHeight: 1.7 } as CSSProperties,
  row: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10 } as CSSProperties,
  op: { fontSize: 22, fontWeight: 900, color: '#7c8da6' } as CSSProperties,
};

/** 縦書きの分数。size は 数字の大きさ（px） */
function Fr({ n, d, w, size = 22, color = INK }: { n: ReactNode; d: ReactNode; w?: ReactNode; size?: number; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 900, fontSize: size, color }}>
      {w !== undefined && w !== null && <span>{w}</span>}
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05 }}>
        <span style={{ padding: '0 4px' }}>{n}</span>
        <span style={{ alignSelf: 'stretch', borderTop: '2.5px solid currentColor', margin: '2px 0' }} />
        <span style={{ padding: '0 4px' }}>{d}</span>
      </span>
    </span>
  );
}

/** 斜線を ひいて 消した もの。now は 上に 小さく書く 新しい 数（赤） */
function Struck({ children, now }: { children: ReactNode; now?: ReactNode }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', padding: '0 4px', opacity: 0.75 }}>
      {now !== undefined && (
        <span style={{
          position: 'absolute', top: -18, left: 0, right: 0, textAlign: 'center', fontSize: 13, fontWeight: 900,
          color: RED, whiteSpace: 'nowrap', opacity: 1,
        }}>{now}</span>
      )}
      {children}
      <span style={{
        position: 'absolute', left: '-6%', top: '50%', width: '112%', height: 2.5, background: RED,
        transform: 'rotate(-24deg)', borderRadius: 2, pointerEvents: 'none',
      }} />
    </span>
  );
}

/** 矢印（×k・÷g の ラベルつき） */
function Arrow({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', color: RED, fontWeight: 900 }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 22, lineHeight: 1 }}>⟶</span>
    </span>
  );
}

const maxLen = (id: string) => (id.startsWith('mul.') ? 2 : 3);

function initialFields(initial: FractionPadProps['initial']): Record<string, string> {
  const f: Record<string, string> = {};
  if (!initial) return f;
  if (initial.multiples) { f['mul.a'] = String(initial.multiples[0]); f['mul.b'] = String(initial.multiples[1]); }
  if (initial.fractions) {
    initial.fractions.slice(0, 3).forEach(([n, d], i) => { f[`com.n${i + 1}`] = String(n); f[`com.d${i + 1}`] = String(d); });
    const [n, d] = initial.fractions[0] ?? [];
    if (n && d) { f['red.n'] = String(n); f['red.d'] = String(d); }
  }
  if (initial.mixed) {
    const { w, n, d } = initial.mixed;
    if (w > 0) { f['cv.w'] = String(w); f['bo.w'] = String(w); }
    if (n >= 0) { f['cv.n'] = String(n); f['bo.n'] = n > 0 ? String(n) : ''; }
    f['cv.d'] = String(d); f['bo.d'] = String(d);
  }
  return f;
}

export function FractionPad({ tools = ALL_TOOLS, initial }: FractionPadProps) {
  const list = tools.length ? tools : ALL_TOOLS;
  const [tool, setTool] = useState<FractionTool>(initial?.tool && list.includes(initial.tool) ? initial.tool : list[0]!);
  const [fields, setFields] = useState<Record<string, string>>(() => initialFields(initial));
  const [active, setActive] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // 道具ごとの状態
  const [mulCount, setMulCount] = useState(10);
  const [circA, setCircA] = useState<number[]>([]);
  const [circB, setCircB] = useState<number[]>([]);
  const [nf, setNf] = useState(Math.min(3, Math.max(2, initial?.fractions?.length ?? 2)));
  const [comOp, setComOp] = useState<'+' | '-'>('+');
  const [gs, setGs] = useState<number[]>([]);
  const [cvMode, setCvMode] = useState<'toMixed' | 'toImproper'>('toMixed');
  const [borrowed, setBorrowed] = useState(false);

  const val = (id: string) => fields[id] ?? '';

  /* ---------- 入力 ---------- */
  const touched = (id: string) => {
    if (id === 'red.n' || id === 'red.d') setGs([]);
    if (id === 'bo.w' || id === 'bo.n' || id === 'bo.d') setBorrowed(false);
  };
  const put = (v: string) => {
    if (!active) { setMsg('書きたい 箱を おしてね。'); return; }
    const cur = val(active);
    if (cur.length >= maxLen(active)) return;
    setFields((f) => ({ ...f, [active]: cur === '0' ? v : cur + v }));
    touched(active);
    setMsg(null);
  };
  const back = () => {
    if (!active) return;
    setFields((f) => ({ ...f, [active]: val(active).slice(0, -1) }));
    touched(active);
  };

  /** ▶ で たどる 箱の じゅん（いま 見えている 箱） */
  const order = (): string[] => {
    switch (tool) {
      case 'multiples': return ['mul.a', 'mul.b'];
      case 'common': {
        const ids: string[] = [];
        for (let i = 1; i <= nf; i++) ids.push(`com.n${i}`, `com.d${i}`);
        ids.push('com.L');
        for (let i = 1; i <= nf; i++) ids.push(`com.x${i}`);
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
    setActive(o[(i + 1) % o.length]!);
  };

  const box = (id: string, label: string, w = 52): ReactNode => (
    <button key={id} type="button" aria-label={label} onClick={() => { setActive(id); setMsg(null); }} style={S.box(active === id, w)}>
      {val(id) || <span style={{ color: '#b6c3d4' }}>□</span>}
    </button>
  );

  const clearTool = () => {
    const prefix = { multiples: 'mul.', common: 'com.', reduce: 'red.', convert: 'cv.', borrow: 'bo.' }[tool];
    setFields((f) => Object.fromEntries(Object.entries(f).filter(([k]) => !k.startsWith(prefix))));
    setCircA([]); setCircB([]); setGs([]); setBorrowed(false); setMsg(null); setActive(null);
    if (tool === 'common') setNf(2);
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
    const toggle = (list: number[], set: (v: number[]) => void, v: number) =>
      set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    const chips = (row: number[], base: number, circ: number[], set: (v: number[]) => void, cur: number[]) => (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        {row.map((v, i) => {
          const on = circ.includes(v);
          const star = on && shared.has(v);
          return (
            <button key={v} type="button" aria-label={`${base}の倍数 ${v}`} aria-pressed={on}
              onClick={() => toggle(cur, set, v)}
              style={{
                minWidth: 46, padding: '4px 6px', borderRadius: 999, cursor: 'pointer', textAlign: 'center',
                fontWeight: 900, fontSize: 17, color: INK,
                background: star ? '#fef3c7' : '#fff', border: star ? `2.5px solid ${AMBER}` : on ? `2.5px solid ${RED}` : '1px solid #cfdcec',
              }}>
              {star && <span style={{ color: AMBER, fontSize: 12 }}>★</span>}{v}
              <span style={{ display: 'block', fontSize: 9, color: '#8496ad', fontWeight: 700 }}>{base}×{i + 1}</span>
            </button>
          );
        })}
      </div>
    );
    return (
      <>
        <p style={S.label}>2つの 数を 入れてね。倍数が ならぶよ。</p>
        <div style={{ ...S.row, marginTop: 0 }}>
          {box('mul.a', '1つめの数', 56)}<span style={S.op}>と</span>{box('mul.b', '2つめの数', 56)}<span style={{ fontWeight: 800, fontSize: 13 }}>の 倍数</span>
        </div>
        {a && (
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 900 }}>{a} の 倍数</span>
            {chips(rowA, a, cA, setCircA, circA)}
          </div>
        )}
        {b && (
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 900 }}>{b} の 倍数</span>
            {chips(rowB, b, cB, setCircB, circB)}
          </div>
        )}
        {(a || b) && mulCount < 40 && (
          <div style={{ marginTop: 10 }}>
            <button type="button" style={S.tool()} onClick={() => setMulCount((n) => Math.min(40, n + 6))}>もっと ふやす</button>
          </div>
        )}
        <p style={S.note}>同じ数を 見つけたら、どちらの行でも ○で かこもう。どちらも ○に した 数には ★が つくよ。いちばん 小さい ★が 最小公倍数。</p>
      </>
    );
  };

  /* ---------- 通分 ---------- */
  const renderCommon = () => {
    const L = toInt(val('com.L'));
    const rows = Array.from({ length: nf }, (_, i) => i + 1);
    const xs = rows.map((i) => toInt0(val(`com.x${i}`)));
    const okRows = rows.filter((i) => toInt(val(`com.n${i}`)) && toInt(val(`com.d${i}`)));
    return (
      <>
        <p style={S.label}>通分したい 分数を 入れてね。</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {rows.map((i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {i > 1 && <span style={S.op}>と</span>}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                {box(`com.n${i}`, `${i}つめの分数の分子`, 50)}
                <span style={{ width: 44, borderTop: '2.5px solid #0f2540' }} />
                {box(`com.d${i}`, `${i}つめの分数の分母`, 50)}
              </span>
            </span>
          ))}
          {nf < 3 && <button type="button" style={S.ghost} onClick={() => setNf(3)}>もう1つ ふやす</button>}
        </div>
        <div style={S.row}>
          <span style={{ fontSize: 13, fontWeight: 900 }}>共通の 分母は</span>{box('com.L', '共通の分母', 60)}
          <span style={{ fontSize: 11, color: '#8496ad', fontWeight: 700 }}>（分母の 公倍数。まず「倍数を ならべる」で 見つけてもいいよ）</span>
        </div>
        {!L && okRows.length > 0 && <p style={{ ...S.label, marginTop: 10 }}>共通の 分母を 入れると、「×」の 矢印が 出るよ。</p>}
        {L && okRows.map((i) => {
          const n = toInt(val(`com.n${i}`))!;
          const d = toInt(val(`com.d${i}`))!;
          const k = scaleFactor(d, L);
          return (
            <div key={i} style={{ ...S.row, gap: 8 }}>
              <Fr n={n} d={d} />
              {k ? (
                <>
                  <Arrow label={`×${k}`} />
                  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {box(`com.x${i}`, `${i}つめの分数の通分後の分子`, 56)}
                    <span style={{ width: 52, borderTop: '2.5px solid #0f2540' }} />
                    <span style={{ fontSize: 21, fontWeight: 900 }}>{L}</span>
                  </span>
                  <span style={{ fontSize: 11, color: RED, fontWeight: 800 }}>分母に ×{k}。分子にも ×{k} だよ</span>
                </>
              ) : (
                <span style={{ fontSize: 12, color: RED, fontWeight: 800 }}>{L} は {d} の 倍数じゃないよ。{d} を {L} には できないね。</span>
              )}
            </div>
          );
        })}
        {L && okRows.length >= 2 && (
          <div style={{ ...S.row, borderTop: '1px dashed #bcd3ec', paddingTop: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 900 }}>分子を</span>
            <button type="button" aria-label="たす・ひくを かえる" onClick={() => setComOp((o) => (o === '+' ? '-' : '+'))} style={S.tool()}>
              {comOp === '+' ? 'たす ＋' : 'ひく －'}
            </button>
            <span style={{ fontSize: 20, fontWeight: 900 }}>
              {okRows.map((i, j) => (
                <span key={i}>{j > 0 && (comOp === '+' ? ' ＋ ' : ' － ')}{xs[i - 1] ?? '□'}</span>
              ))}
              {' ＝ '}
            </span>
            {box('com.s', '分子の答え', 56)}
            {toInt0(val('com.s')) !== null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={S.op}>→</span><Fr n={val('com.s')} d={L} /></span>}
          </div>
        )}
        {msg && <p style={S.msg}>{msg}</p>}
        <p style={S.note}>分母に かけた 数を、分子にも かけるよ（大きさは かわらない）。「たす・ひく」の ところは 分母は そのままで 分子だけ 計算するよ。</p>
      </>
    );
  };

  /* ---------- 約分 ---------- */
  const renderReduce = () => {
    const n = toInt(val('red.n'));
    const d = toInt(val('red.d'));
    const stages = n && d ? reduceChain(n, d, gs).stages : [];
    const last = stages[stages.length - 1];
    const apply = (g: number) => {
      if (!last) { setMsg('分数を 入れてね。'); return; }
      const r = applyDivisor(last.n, last.d, g);
      if (!r.ok) { setMsg(r.reason); return; }
      setMsg(null);
      setGs((x) => [...x, g]);
    };
    const g = toInt(val('red.g'));
    return (
      <>
        <p style={S.label}>約分したい 分数を 入れてね。</p>
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {box('red.n', '分子', 56)}
          <span style={{ width: 52, borderTop: '2.5px solid #0f2540' }} />
          {box('red.d', '分母', 56)}
        </span>
        {last && (
          <>
            <div style={{ ...S.row, gap: 10 }}>
              {stages.map((s, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  {i > 0 && <Arrow label={`÷${s.g}`} />}
                  {i < stages.length - 1 ? <Struck><Fr n={s.n} d={s.d} /></Struck> : <Fr n={s.n} d={s.d} />}
                </span>
              ))}
            </div>
            <p style={{ ...S.label, marginTop: 12 }}>分子と 分母を どちらも わる 数を えらぼう（われなければ 理由が 出るよ）</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {[2, 3, 5, 7].map((c) => (
                <button key={c} type="button" aria-label={`${c}でわる`} style={S.tool()} onClick={() => apply(c)}>÷{c}</button>
              ))}
              <span style={{ fontSize: 14, fontWeight: 900, marginLeft: 6 }}>÷</span>
              {box('red.g', 'わる数', 52)}
              <button type="button" aria-label="この数でわる" style={S.tool()} onClick={() => { if (g) { apply(g); setFields((f) => ({ ...f, 'red.g': '' })); } else setMsg('わる 数を 入れてね。'); }}>わる</button>
              {gs.length > 0 && <button type="button" style={S.ghost} onClick={() => { setGs((x) => x.slice(0, -1)); setMsg(null); }}>ひとつ もどす</button>}
            </div>
          </>
        )}
        {msg && <p style={S.msg}>{msg}</p>}
        <p style={S.note}>約分は、分子と 分母を 同じ数で わること。もう われなく なるまで つづけよう。数が 大きいときは、大きい 数で わると 1回で すむよ。</p>
      </>
    );
  };

  /* ---------- 仮分数・帯分数 ---------- */
  const renderConvert = () => {
    const w = toInt0(val('cv.w'));
    const n = toInt0(val('cv.n'));
    const d = toInt(val('cv.d'));
    const modeBtns = (
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button type="button" style={S.tab(cvMode === 'toMixed')} onClick={() => { setCvMode('toMixed'); setActive(null); }}>仮分数 → 帯分数</button>
        <button type="button" style={S.tab(cvMode === 'toImproper')} onClick={() => { setCvMode('toImproper'); setActive(null); }}>帯分数 → 仮分数</button>
      </div>
    );
    const input = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {box('cv.w', '整数（なければ空）', 50)}
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {box('cv.n', '分子', 50)}
          <span style={{ width: 44, borderTop: '2.5px solid #0f2540' }} />
          {box('cv.d', '分母', 50)}
        </span>
        <span style={{ fontSize: 11, color: '#8496ad', fontWeight: 700 }}>整数が ないときは 空に して おこう</span>
      </div>
    );
    if (cvMode === 'toMixed') {
      const q = toInt0(val('cv.q'));
      const r = toInt0(val('cv.r'));
      const improper = n !== null && d !== null && n >= d;
      return (
        <>
          {modeBtns}{input}
          {n !== null && d !== null && !improper && <p style={{ ...S.label, marginTop: 10 }}>分子が 分母より 小さいから、このままで 帯分数に する ところは ないよ。</p>}
          {improper && (
            <>
              <div style={{ ...S.row, gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 900 }}>{n} ÷ {d} ＝</span>{box('cv.q', '商', 50)}
                <span style={{ fontSize: 15, fontWeight: 900 }}>あまり</span>{box('cv.r', 'あまり', 50)}
              </div>
              {q !== null && r !== null && (
                <p style={{ ...S.label, marginTop: 8 }}>たしかめ: {d} × {q} ＋ {r} ＝ {divCheck(d!, q, r)}（{n} に なるかな？）</p>
              )}
              {q !== null && r !== null && (
                <div style={{ ...S.row, gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 900 }}>帯分数に すると</span>
                  {r === 0 ? <span style={{ fontSize: 22, fontWeight: 900 }}>{(w ?? 0) + q}</span> : <Fr w={(w ?? 0) + q > 0 ? (w ?? 0) + q : undefined} n={r} d={d!} />}
                  {w !== null && w > 0 && <span style={{ fontSize: 11, color: RED, fontWeight: 800 }}>整数 {w} に 商 {q} を くり上げたよ</span>}
                </div>
              )}
            </>
          )}
        </>
      );
    }
    const x = toInt0(val('cv.x'));
    return (
      <>
        {modeBtns}{input}
        {n !== null && d !== null && (
          <>
            <div style={{ ...S.row, gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 900 }}>{d} × {w ?? 0} ＋ {n} ＝</span>{box('cv.x', '仮分数の分子', 56)}
            </div>
            {x !== null && (
              <div style={{ ...S.row, gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900 }}>仮分数に すると</span><Fr n={x} d={d} />
              </div>
            )}
          </>
        )}
      </>
    );
  };

  /* ---------- くり下げ ---------- */
  const renderBorrow = () => {
    const w = toInt0(val('bo.w'));
    const n = toInt0(val('bo.n')) ?? 0;
    const d = toInt(val('bo.d'));
    const wholeOnly = n === 0;
    const doBorrow = () => {
      if (w === null || w < 1) { setMsg('整数が 1以上の ときに くり下げられるよ。'); return; }
      if (!d) { setMsg('分母を 入れてね。整数だけの ときは、使いたい 分母を 自分で きめて 入れよう。'); return; }
      setMsg(null); setBorrowed(true);
    };
    const res = w !== null && d ? borrowOne({ w, n, d }) : null;
    const a = toInt0(val('bo.a'));
    const b = toInt0(val('bo.b'));
    return (
      <>
        <p style={S.label}>ひかれる 数を 入れてね。（整数だけ なら 分子は 空で、分母は 自分で きめて 入れる）</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {box('bo.w', '整数', 50)}
          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {box('bo.n', '分子', 50)}
            <span style={{ width: 44, borderTop: '2.5px solid #0f2540' }} />
            {box('bo.d', '分母', 50)}
          </span>
          <button type="button" style={S.tool(borrowed)} onClick={() => (borrowed ? setBorrowed(false) : doBorrow())}>
            {borrowed ? 'もとに もどす' : '1 くり下げる'}
          </button>
        </div>
        {borrowed && res && w !== null && d && (
          <>
            <div style={{ ...S.row, gap: 14, marginTop: 24 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Struck now={res.w}><span style={{ fontSize: 24, fontWeight: 900 }}>{w}</span></Struck>
                {!wholeOnly && (
                  <Struck now={`${res.n}/${d}`}><Fr n={n} d={d} /></Struck>
                )}
                {wholeOnly && <span style={{ fontSize: 22, fontWeight: 900, color: RED }}>＋ <Fr n={d} d={d} color={RED} /></span>}
              </span>
              <span style={S.op}>→</span>
              <Fr w={res.w > 0 ? res.w : undefined} n={res.n} d={d} />
            </div>
            <p style={{ ...S.label, marginTop: 10 }}>
              {w} から 1 くり下げて {res.w}。その 1 は {Fr_text(d, d)} だから、{wholeOnly ? `${d}/${d}` : `${n}/${d} に ${d}/${d} を たして ${res.n}/${d}`}。
            </p>
            <div style={{ ...S.row, gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 900 }}>ひき算の 答え  分数の ところ（分子）</span>{box('bo.a', '分子の答え', 56)}
              <span style={{ fontSize: 13, fontWeight: 900 }}>整数の ところ</span>{box('bo.b', '整数の答え', 50)}
            </div>
            {a !== null && b !== null && (
              <div style={{ ...S.row, gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900 }}>書くと</span><Fr w={b > 0 ? b : undefined} n={a} d={d} />
                <span style={{ fontSize: 11, color: '#8496ad', fontWeight: 700 }}>（約分できるか 見よう。「約分」の 道具が つかえるよ）</span>
              </div>
            )}
          </>
        )}
        {msg && <p style={S.msg}>{msg}</p>}
        <p style={S.note}>分数の ところが ひけない ときは、整数から 1 くり下げて、その 1 を 分母と 同じ数の 分数（{Fr_text(3, 3)}など）に して 分数に たすよ。</p>
      </>
    );
  };

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <p style={S.title}>分数の けいさんらん（じゆうに つかっていいよ）</p>
        <span style={{ marginLeft: 'auto' }}>
          <button type="button" onClick={clearTool} style={S.ghost}>ぜんぶ けす</button>
        </span>
      </div>
      {list.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {list.map((t) => (
            <button key={t} type="button" onClick={() => { setTool(t); setActive(null); setMsg(null); }} style={S.tab(tool === t)}>{TOOL_LABEL[t]}</button>
          ))}
        </div>
      )}
      {tool === 'multiples' && renderMultiples()}
      {tool === 'common' && renderCommon()}
      {tool === 'reduce' && renderReduce()}
      {tool === 'convert' && renderConvert()}
      {tool === 'borrow' && renderBorrow()}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 14 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((c) => (
          <button key={c} type="button" onClick={() => put(c)} style={S.key}>{c}</button>
        ))}
        <button type="button" aria-label="つぎの箱へ" onClick={next} style={S.key}>つぎ ▶</button>
        <button type="button" aria-label="1文字けす" onClick={back} style={{ ...S.key, color: RED }}>←</button>
      </div>
      <p style={S.note}>ここは 答え合わせを しないよ。答えは 上の らんに 入れてね。</p>
    </div>
  );
}

/** 文章の 中に 書く 分数（n/d）。縦書きは 使わない（小さい 説明文用） */
function Fr_text(n: number, d: number): string {
  return `${n}/${d}`;
}

/**
 * ボタンを押したときだけ開く「分数のけいさんらん」。
 * **はじめは閉じておく。** 簡単な設問では要らないので、いつも開いていると画面が煩雑になる。
 */
export function FractionPadToggle(props: FractionPadProps & { label?: string }) {
  const { label = '分数の けいさんらんを つかう', ...rest } = props;
  const [open, setOpen] = useState(false);
  return (
    <div style={{ textAlign: 'center' }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        style={{
          border: 0, borderRadius: 999, cursor: 'pointer',
          background: '#e0f2fe', color: '#0369a1', fontWeight: 900, fontSize: 13,
          padding: '8px 16px', fontFamily: FONT,
        }}>
        📝 {open ? 'けいさんらんを とじる' : label}
      </button>
      {open && <FractionPad {...rest} />}
    </div>
  );
}
