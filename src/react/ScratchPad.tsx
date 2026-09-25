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
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  buildLayout, applyBorrows, toggleBorrow, rowValues, typeDigit, carryOf, commonZeros,
  DIV_STEPS_MAX, type ScratchOp, type Layout, type InputRow, type FixedRow,
} from './scratchLayout.js';

export type { ScratchOp } from './scratchLayout.js';

const OPS: { op: ScratchOp; label: string }[] = [
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
const SIGN: Record<ScratchOp, string> = { '+': '+', '-': '−', '×': '×', '÷': '÷' };

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
  } as CSSProperties,
  head: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' } as CSSProperties,
  title: { fontSize: 12, fontWeight: 800, color: '#2f4d75', margin: 0 } as CSSProperties,
  opBtn: (on: boolean): CSSProperties => ({
    border: 0, borderRadius: 10, cursor: 'pointer', fontWeight: 900, fontSize: 15,
    padding: '6px 12px', background: on ? '#0ea5e9' : '#e8eff8', color: on ? '#fff' : '#54637a',
  }),
  /** 立式の数を入れる箱 */
  field: (on: boolean): CSSProperties => ({
    minWidth: 96, height: 46, padding: '0 10px', borderRadius: 10, cursor: 'pointer',
    display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 900, color: INK,
    background: on ? '#e0f2fe' : '#fff', border: on ? '2px solid #0ea5e9' : '1px solid #cfdcec',
    boxSizing: 'border-box', letterSpacing: 1,
  }),
  /**
   * 書きこむマス。**空でも枠が見えるようにする。**
   * 枠を透明にすると、子どもには「どこに書けるのか」が分からない。
   */
  cell: (on: boolean): CSSProperties => ({
    position: 'relative', width: CW - 2, height: CH, margin: '0 1px', fontSize: 22, fontWeight: 800,
    display: 'grid', placeItems: 'center', cursor: 'pointer', userSelect: 'none',
    background: on ? '#e0f2fe' : '#fff', border: on ? '2px solid #0ea5e9' : '1px solid #dbe6f3',
    borderRadius: 5, boxSizing: 'border-box', color: INK,
  }),
  /** 問題の数（書きかえない）。枠は付けず、紙に印刷された数字のように見せる */
  fixed: {
    position: 'relative', width: CW, height: CH, fontSize: 24, fontWeight: 800,
    display: 'grid', placeItems: 'center', userSelect: 'none', color: INK,
  } as CSSProperties,
  key: {
    minWidth: 42, height: 40, borderRadius: 8, border: '1px solid #cfdcec', background: '#f2f7fd',
    fontSize: 17, fontWeight: 800, color: '#2f4d75', cursor: 'pointer', padding: '0 8px',
  } as CSSProperties,
  ghost: {
    border: '1px solid #dbe4f0', borderRadius: 10, background: '#fff',
    color: '#64748b', fontWeight: 800, fontSize: 12, padding: '6px 12px', cursor: 'pointer',
  } as CSSProperties,
  tool: (on = false): CSSProperties => ({
    border: on ? `2px solid ${RED}` : '1px solid #dbe4f0', borderRadius: 10,
    background: on ? '#fff1f2' : '#fff', color: on ? RED : '#475569',
    fontWeight: 800, fontSize: 12, padding: '6px 10px', cursor: 'pointer',
  }),
  primary: {
    border: 0, borderRadius: 12, background: '#0ea5e9', color: '#fff', fontWeight: 900,
    fontSize: 15, padding: '10px 18px', cursor: 'pointer',
  } as CSSProperties,
  note: { fontSize: 11, color: '#8496ad', marginTop: 10, marginBottom: 0, lineHeight: 1.7 } as CSSProperties,
  msg: { fontSize: 12, color: RED, fontWeight: 800, margin: '8px 0 0', textAlign: 'center' } as CSSProperties,
};

export interface ScratchPadProps {
  /**
   * 最初に選んでおく計算。省略すると ops の1つ目。
   * 開いたとたんに ぜんぜんちがう筆算のわくが出ていると、子どもは
   * 「この計算をしなさい」と言われた気になる。単元でよく使う計算を先頭に置く。
   */
  defaultOp?: ScratchOp;
  /** 使える計算を絞る（例: たし算とひき算だけの単元） */
  ops?: ScratchOp[];
  /** 小数点キーを出すか。小数を扱わない単元では消せる */
  decimal?: boolean;
  /** 使わない（前の版の名残り。わり算の段の数は、中で ふやせる） */
  rows?: number;
  /**
   * 数が問題文にそのまま書いてある場面（たしかめ算など）だけ、はじめから筆算の形で開く。
   * **文章題では渡さない。** 何と何をどう計算するかは、子どもが決めることなので。
   */
  initial?: { op: ScratchOp; a: string; b: string };
}

type Sel = { row: string; col: number } | null;

/** 斜線を引いた数字。now があれば、上に小さく新しい数を書く（10 かりたあと） */
function Struck({ digit, now, faint }: { digit: string; now?: number; faint?: boolean }) {
  return (
    <>
      {now !== undefined && (
        <span style={{
          position: 'absolute', top: -13, left: 0, right: 0, textAlign: 'center',
          fontSize: 13, fontWeight: 900, color: RED,
        }}>{now}</span>
      )}
      <span style={{ position: 'relative', color: faint ? '#b6c3d4' : '#94a3b8' }}>
        {digit}
        <span style={{
          position: 'absolute', left: '-25%', top: '50%', width: '150%', height: 2.5, background: RED,
          transform: 'rotate(-28deg)', borderRadius: 2,
        }} />
      </span>
    </>
  );
}

function Point() {
  return (
    <span style={{ position: 'absolute', right: -5, bottom: 2, fontSize: 24, fontWeight: 900, color: INK, lineHeight: 1 }}>.</span>
  );
}

export function ScratchPad({
  defaultOp, ops = ['+', '-', '×', '÷'], decimal = true, initial,
}: ScratchPadProps) {
  const [op, setOp] = useState<ScratchOp>(initial?.op ?? defaultOp ?? ops[0] ?? '÷');
  const [a, setA] = useState(initial?.a ?? '');
  const [b, setB] = useState(initial?.b ?? '');
  const [field, setField] = useState<'a' | 'b'>('a');
  const [stage, setStage] = useState<'setup' | 'work'>(initial ? 'work' : 'setup');
  const [msg, setMsg] = useState<string | null>(null);

  // 計算の段
  const [cells, setCells] = useState<Record<string, string[]>>({});
  const [points, setPoints] = useState<Record<string, number | null>>({});
  const [borrows, setBorrows] = useState<Record<string, number[]>>({});
  const [sel, setSel] = useState<Sel>(null);
  const [borrowMode, setBorrowMode] = useState(false);
  // わり算だけの道具
  const [extraZeros, setExtraZeros] = useState(0);
  const [divSteps, setDivSteps] = useState<number | undefined>(undefined);
  const [struck, setStruck] = useState(0);

  const zerosCanStrike = op === '÷' ? commonZeros(a, b) : 0;
  const effA = struck ? a.slice(0, -struck) : a;
  const effB = struck ? b.slice(0, -struck) : b;
  const built = useMemo(
    () => buildLayout({ op, a: effA, b: effB, extraZeros, divSteps }),
    [op, effA, effB, extraZeros, divSteps],
  );
  const layout: Layout | null = built.ok ? built.layout : null;

  const resetWork = () => {
    setCells({}); setPoints({}); setBorrows({}); setSel(null); setBorrowMode(false); setMsg(null);
  };

  /* ---------- 立式 ---------- */
  const setupPut = (v: string) => {
    const cur = field === 'a' ? a : b;
    const limit = op === '÷' && field === 'b' ? DIVISOR_MAX : NUM_MAX;
    if (v === '.') {
      if (!decimal || cur.includes('.') || cur === '') return;
    } else if (cur.replace('.', '').length >= limit) return;
    (field === 'a' ? setA : setB)(cur + v);
    setMsg(null);
  };
  const setupBack = () => (field === 'a' ? setA : setB)((s) => s.slice(0, -1));
  const toWork = () => {
    const r = buildLayout({ op, a, b });
    if (!r.ok) { setMsg(r.reason); return; }
    resetWork(); setExtraZeros(0); setDivSteps(undefined); setStruck(0);
    setStage('work');
  };

  /* ---------- 計算 ---------- */
  const rowsById = useMemo(() => {
    const m = new Map<string, InputRow>();
    if (!layout) return m;
    if (layout.kind === 'column') {
      for (const r of layout.partials) m.set(r.id, r);
      m.set(layout.answer.id, layout.answer);
    } else {
      m.set(layout.quotient.id, layout.quotient);
      for (const s of layout.steps) { m.set(s.product.id, s.product); m.set(s.diff.id, s.diff); }
    }
    return m;
  }, [layout]);

  const width = layout?.width ?? 0;
  const bufOf = (id: string) => {
    const arr = cells[id] ?? [];
    return Array.from({ length: width }, (_, i) => arr[i] ?? '');
  };
  /** いちばん左のマスは 左どなりが無いので、くり上がりの2けた目を入れない */
  const maxAt = (r: InputRow, col: number) => (col === r.start ? 1 : r.max);

  const move = (d: -1 | 1) => setSel((s) => {
    if (!s) return s;
    const r = rowsById.get(s.row);
    if (!r) return s;
    return { row: s.row, col: Math.min(r.end, Math.max(r.start, s.col + d)) };
  });

  const workPut = (v: string) => {
    if (!sel) { setMsg('書きたい マスを おしてね。'); return; }
    const r = rowsById.get(sel.row);
    if (!r) return;
    if (v === '.') {
      if (!r.freePoint) return;
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
    if (r.id === 'q') move(1);
    else if (layout?.kind === 'column' && next.length >= max) move(-1);
  };
  const workBack = () => {
    if (!sel) return;
    const buf = bufOf(sel.row);
    buf[sel.col] = (buf[sel.col] ?? '').slice(0, -1);
    setCells((c) => ({ ...c, [sel.row]: buf }));
  };
  const clearAll = () => {
    if (stage === 'setup') { setA(''); setB(''); setField('a'); setMsg(null); return; }
    resetWork();
  };

  /** 10 を かりる。base は その段の いまの数字 */
  const borrowAt = (rowKey: string, base: (number | null)[], col: number) => {
    const cur = borrows[rowKey] ?? [];
    const next = toggleBorrow(base, cur, col);
    if (next.length === cur.length && !cur.includes(col)) {
      setMsg('左に かりられる 数字が ないよ。');
      return;
    }
    setMsg(null);
    setBorrows((m) => ({ ...m, [rowKey]: next }));
  };

  const tapCell = (r: InputRow, col: number) => {
    if (borrowMode && r.borrowable) {
      borrowAt(r.id, rowValues(bufOf(r.id)), col);
      return;
    }
    setBorrowMode(false);
    setSel({ row: r.id, col });
    setMsg(null);
  };

  /* ---------- 描画 ---------- */
  const renderFixed = (row: FixedRow, borrowKey: string | null, extra?: ReactNode) => {
    const base = row.cells.map((c) => (c ? Number(c.digit) : null));
    const view = borrowKey ? applyBorrows(base, borrows[borrowKey] ?? []) : null;
    return (
      <div style={{ display: 'flex' }}>
        {row.cells.map((c, i) => {
          const tappable = !!(borrowKey && c);
          return (
            <div key={i} onClick={tappable ? () => borrowAt(borrowKey!, base, i) : undefined}
              style={{ ...S.fixed, cursor: tappable ? 'pointer' : 'default' }}>
              {c && (view?.changed[i]
                ? <Struck digit={c.digit} now={view.values[i]!} faint={c.helper} />
                : <span style={{ color: c.helper ? '#b6c3d4' : INK }}>{c.digit}</span>)}
              {row.pointAfter === i && <Point />}
            </div>
          );
        })}
        {extra}
      </div>
    );
  };

  const renderInput = (r: InputRow) => {
    const buf = bufOf(r.id);
    const view = r.borrowable ? applyBorrows(rowValues(buf), borrows[r.id] ?? []) : null;
    const pt = r.freePoint ? points[r.id] ?? null : r.fixedPointAfter;
    return (
      <div style={{
        display: 'flex', paddingBottom: r.lineBelow ? 3 : 0,
        borderBottom: r.lineBelow ? `2px solid ${INK}` : 'none',
      }}>
        {Array.from({ length: width }, (_, col) => {
          if (col < r.start || col > r.end) return <div key={col} style={{ width: CW, height: CH }} />;
          const v = buf[col] ?? '';
          const main = v.slice(-1);
          const carry = col < r.end ? carryOf(buf[col + 1] ?? '') : null;
          const on = sel?.row === r.id && sel.col === col;
          return (
            <div key={col} onClick={() => tapCell(r, col)} style={S.cell(on)}>
              {carry && (
                <span style={{
                  position: 'absolute', top: -8, right: -4, fontSize: 11, fontWeight: 900, color: AMBER,
                  background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 4, padding: '0 3px',
                  lineHeight: 1.3, zIndex: 1,
                }}>{carry}</span>
              )}
              {view?.changed[col] && main !== '' ? <Struck digit={main} now={view.values[col]!} /> : main}
              {pt === col && <Point />}
            </div>
          );
        })}
      </div>
    );
  };

  const signCol = (s: string) => (
    <span style={{ width: 26, fontSize: 20, fontWeight: 800, color: '#7c8da6', textAlign: 'center', flexShrink: 0 }}>{s}</span>
  );
  const gap: CSSProperties = { marginTop: 12 };

  const renderColumn = (l: Extract<Layout, { kind: 'column' }>) => (
    <div style={{ display: 'inline-block' }}>
      <div style={{ display: 'flex', alignItems: 'center', ...gap }}>
        {signCol('')}{renderFixed(l.top, l.borrowTop ? 'top' : null)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', ...gap }}>
        {signCol(SIGN[op])}
        <div style={{ borderBottom: `3px solid ${INK}`, paddingBottom: 2 }}>{renderFixed(l.bottom, null)}</div>
      </div>
      {l.partials.map((r, i) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', ...gap }}>
          {signCol('')}
          <div style={i === l.partials.length - 1 ? { borderBottom: `3px solid ${INK}`, paddingBottom: 3 } : undefined}>
            {renderInput(r)}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', ...gap }}>
        {signCol('')}{renderInput(l.answer)}
      </div>
    </div>
  );

  const renderDivision = (l: Extract<Layout, { kind: 'division' }>) => {
    const divW = Math.max(52, (l.divisor.length + struck) * 15 + 18);
    const pad = <div style={{ width: divW, flexShrink: 0 }} />;
    // 0を消す くふうで消した0は、わられる数の右に 斜線つきで残す（消したことが見えるように）
    const struckZeros = struck > 0 && (
      <span style={{ display: 'flex' }}>
        {Array.from({ length: struck }, (_, i) => (
          <span key={i} style={{ ...S.fixed, width: CW - 6 }}><Struck digit="0" /></span>
        ))}
      </span>
    );
    return (
      <div style={{ display: 'inline-block' }}>
        <div style={{ display: 'flex', ...gap }}>{pad}{renderInput(l.quotient)}</div>
        <div style={{ display: 'flex', alignItems: 'stretch', marginTop: 4 }}>
          <div style={{
            width: divW, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            paddingRight: 6, boxSizing: 'border-box', fontSize: 24, fontWeight: 800,
            borderRight: `3px solid ${INK}`, borderTopRightRadius: 12,
          }}>
            {l.divisor}
            {Array.from({ length: struck }, (_, i) => (
              <span key={i} style={{ position: 'relative', marginLeft: 1, display: 'inline-grid', placeItems: 'center' }}>
                <Struck digit="0" />
              </span>
            ))}
          </div>
          <div style={{ borderTop: `3px solid ${INK}`, paddingTop: 10 }}>
            {renderFixed(l.dividend, 'dividend', struckZeros)}
          </div>
        </div>
        {l.steps.map((s) => (
          <div key={s.product.id}>
            <div style={{ display: 'flex', ...gap }}>{pad}{renderInput(s.product)}</div>
            <div style={{ display: 'flex', ...gap }}>{pad}{renderInput(s.diff)}</div>
          </div>
        ))}
      </div>
    );
  };

  const help: Record<ScratchOp, string> = {
    '+': 'たてに たして、2けたに なったら そのまま 2つ 入れてね。くり上がりが 左に 小さく出るよ。',
    '-': 'ひけないときは、上の数の 数字を おしてね。左から 10 かりるよ（もう一度 おすと もどる）。',
    '×': '2けたを 入れると、くり上がりが 左に 小さく出るよ。答えの 小数点は「.」で 打てるよ。',
    '÷': 'いちばん上が 商。かけた数を 書いたら、その下で ひこう。ひけないときは「10を かりる」を おしてから 数字を おしてね。',
  };

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <p style={S.title}>
          けいさんらん（じゆうに つかっていいよ）
          {stage === 'work' && (
            <span style={{ fontWeight: 900, color: INK, marginLeft: 8, fontSize: 14 }}>{a} {SIGN[op]} {b}</span>
          )}
        </p>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {stage === 'work' && (
            <button type="button" onClick={() => { resetWork(); setStage('setup'); }} style={S.ghost}>式を なおす</button>
          )}
          <button type="button" onClick={clearAll} style={S.ghost}>ぜんぶ けす</button>
        </span>
      </div>

      {stage === 'setup' ? (
        <>
          {ops.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {OPS.filter((o) => ops.includes(o.op)).map((o) => (
                <button key={o.op} type="button" onClick={() => { setOp(o.op); setMsg(null); }} style={S.opBtn(op === o.op)}>
                  {SIGN[o.op]} {o.label}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div role="button" aria-label="1つめの数" onClick={() => setField('a')} style={S.field(field === 'a')}>{a || ' '}</div>
              <span style={{ fontSize: 11, color: '#8496ad', fontWeight: 700 }}>{op === '÷' ? 'わられる数' : '上の数'}</span>
            </div>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#7c8da6', lineHeight: '46px' }}>{SIGN[op]}</span>
            <div style={{ textAlign: 'center' }}>
              <div role="button" aria-label="2つめの数" onClick={() => setField('b')} style={S.field(field === 'b')}>{b || ' '}</div>
              <span style={{ fontSize: 11, color: '#8496ad', fontWeight: 700 }}>{op === '÷' ? 'わる数' : '下の数'}</span>
            </div>
          </div>
          <Keys decimal={decimal} onDigit={setupPut} onBack={setupBack} />
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button type="button" onClick={toWork} style={S.primary}>筆算にする</button>
          </div>
          {msg && <p style={S.msg}>{msg}</p>}
          <p style={S.note}>
            数を 入れて「筆算にする」を おすと、位の そろった 筆算に なるよ。ここは 答え合わせを しないよ。
          </p>
        </>
      ) : layout ? (
        <>
          {layout.kind === 'division' && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              <button type="button" onClick={() => { setBorrowMode((v) => !v); setMsg(null); }} style={S.tool(borrowMode)}>
                {borrowMode ? '10を かりる：オン' : '10を かりる'}
              </button>
              {extraZeros < EXTRA_ZERO_MAX && struck === 0 && (
                <button type="button" onClick={() => setExtraZeros((n) => n + 1)} style={S.tool()}>0を つけたす（わり進む）</button>
              )}
              {layout.steps.length < DIV_STEPS_MAX && (
                <button type="button" onClick={() => setDivSteps(layout.steps.length + 1)} style={S.tool()}>だんを ふやす</button>
              )}
              {struck < zerosCanStrike && extraZeros === 0 && (
                <button type="button" onClick={() => { setStruck((n) => n + 1); resetWork(); }} style={S.tool()}>0を 消す くふう</button>
              )}
            </div>
          )}
          <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
            {layout.kind === 'column' ? renderColumn(layout) : renderDivision(layout)}
          </div>
          <Keys decimal={decimal} onDigit={workPut} onBack={workBack} onMove={move} />
          {msg && <p style={S.msg}>{msg}</p>}
          <p style={S.note}>{help[op]} 答えは 上の らんに 入れてね。</p>
        </>
      ) : (
        <p style={S.msg}>{built.ok ? '' : built.reason}</p>
      )}
    </div>
  );
}

/** けいさんらんのキー。答えの入力らんと見た目を変えて、取りちがえないようにする */
function Keys({ decimal, onDigit, onBack, onMove }: {
  decimal: boolean; onDigit: (v: string) => void; onBack: () => void; onMove?: (d: -1 | 1) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((n) => (
        <button key={n} type="button" onClick={() => onDigit(n)} style={S.key}>{n}</button>
      ))}
      {decimal && <button type="button" onClick={() => onDigit('.')} style={S.key}>.</button>}
      {onMove && (
        <>
          <button type="button" aria-label="左のマスへ" onClick={() => onMove(-1)} style={S.key}>◀</button>
          <button type="button" aria-label="右のマスへ" onClick={() => onMove(1)} style={S.key}>▶</button>
        </>
      )}
      <button type="button" aria-label="1文字けす" onClick={onBack} style={{ ...S.key, color: RED }}>←</button>
    </div>
  );
}

/**
 * ボタンを押したときだけ開く「けいさんらん」。
 *
 * **はじめは閉じておく。** 簡単な設問では要らないので、いつも開いていると
 * 画面が煩雑になり、本来の問題が下に押しやられる。
 */
export function ScratchPadToggle(props: ScratchPadProps & { label?: string }) {
  const { label = '筆算で けいさんする', ...rest } = props;
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
      {open && <ScratchPad {...rest} />}
    </div>
  );
}
