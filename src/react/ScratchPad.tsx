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

export type ScratchOp = '+' | '-' | '×' | '÷';

const OPS: { op: ScratchOp; label: string }[] = [
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
    borderRadius: 18, border: '2px dashed #bcd3ec', background: '#f7fbff',
    padding: 14, marginTop: 10, marginBottom: 10,
    fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    color: '#0f2540',
  },
  head: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  title: { fontSize: 12, fontWeight: 800, color: '#2f4d75', margin: 0 },
  opBtn: (on: boolean) => ({
    border: 0, borderRadius: 10, cursor: 'pointer', fontWeight: 900, fontSize: 15,
    padding: '6px 12px', background: on ? '#0ea5e9' : '#e8eff8', color: on ? '#fff' : '#54637a',
  }),
  /**
   * 1マス。**空でも枠が見えるようにする。**
   * 枠を透明にすると、子どもには「どこに書けるのか」が分からない
   * （実際、最初の版がそうなっていて、線だけが並んで見えた）。
   */
  cell: (on: boolean) => ({
    width: 32, height: 38, fontSize: 20, fontWeight: 800,
    display: 'grid', placeItems: 'center', cursor: 'pointer', userSelect: 'none',
    background: on ? '#e0f2fe' : '#fff',
    border: on ? '2px solid #0ea5e9' : '1px solid #e3ebf5',
    borderRadius: 4, boxSizing: 'border-box', color: '#0f2540',
  }),
  /** けいさんらんのキーパッド。答えの入力らんと見た目を変えて、取りちがえないようにする */
  key: {
    width: 42, height: 38, borderRadius: 8, border: '1px solid #cfdcec', background: '#f2f7fd',
    fontSize: 16, fontWeight: 800, color: '#2f4d75', cursor: 'pointer',
  },
  ghost: {
    border: '1px solid #dbe4f0', borderRadius: 10, background: '#fff',
    color: '#64748b', fontWeight: 800, fontSize: 12, padding: '6px 12px', cursor: 'pointer',
  },
} satisfies Record<string, unknown>;

interface Cursor { row: number; col: number }

export interface ScratchPadProps {
  /** 最初に選んでおく計算。省略するとわり算 */
  defaultOp?: ScratchOp;
  /** 使える計算を絞る（例: たし算とひき算だけの単元） */
  ops?: ScratchOp[];
  /** 小数点キーを出すか。小数を扱わない単元では消せる */
  decimal?: boolean;
  /** 何行ぶん書けるようにするか（筆算の途中式の行数） */
  rows?: number;
}

export function ScratchPad({
  defaultOp = '÷', ops = ['+', '-', '×', '÷'], decimal = true, rows = 6,
}: ScratchPadProps) {
  const [op, setOp] = useState<ScratchOp>(defaultOp);
  const [grid, setGrid] = useState<string[][]>(() => Array.from({ length: rows }, emptyRow));
  const [cur, setCur] = useState<Cursor>({ row: 0, col: COLS - 3 });

  const put = (v: string) => {
    setGrid((g) => {
      const next = g.map((r) => [...r]);
      next[cur.row]![cur.col] = v;
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
        next[c.row]![col] = '';
        return next;
      });
      return { row: c.row, col };
    });
  };

  const clear = () => {
    setGrid(Array.from({ length: rows }, emptyRow));
    setCur({ row: 0, col: COLS - 3 });
  };

  return (
    <div style={S.wrap as React.CSSProperties}>
      <div style={S.head as React.CSSProperties}>
        <p style={S.title as React.CSSProperties}>
          けいさんらん（じゆうに つかっていいよ）
          <span style={{ fontWeight: 600, color: '#8496ad', marginLeft: 6 }}>マスを おして 数を 入れてね</span>
        </p>
        <button type="button" onClick={clear} style={{ ...(S.ghost as React.CSSProperties), marginLeft: 'auto' }}>
          ぜんぶ けす
        </button>
      </div>

      {ops.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {OPS.filter((o) => ops.includes(o.op)).map((o) => (
            <button key={o.op} type="button" onClick={() => setOp(o.op)}
              style={S.opBtn(op === o.op) as React.CSSProperties}>
              {o.op} {o.label}
            </button>
          ))}
        </div>
      )}

      {/* わり算だけ形がちがう。他の3つは たてに ならべて 下に線を引く形 */}
      {op === '÷' ? <DivisionFrame grid={grid} cur={cur} setCur={setCur} />
        : <ColumnFrame grid={grid} cur={cur} setCur={setCur} op={op} />}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((n) => (
          <button key={n} type="button" onClick={() => put(n)} style={S.key as React.CSSProperties}>{n}</button>
        ))}
        {decimal && (
          <button type="button" onClick={() => put('.')} style={S.key as React.CSSProperties}>.</button>
        )}
        <button type="button" onClick={back}
          style={{ ...(S.key as React.CSSProperties), color: '#e11d48' }}>←</button>
      </div>

      <p style={{ fontSize: 11, color: '#8496ad', marginTop: 10, marginBottom: 0, lineHeight: 1.7 }}>
        ここは 答え合わせを しないよ。じゆうに 書いて、答えは 上の らんに 入れてね。
      </p>
    </div>
  );
}

/** たし算・ひき算・かけ算。上下にならべて、下に線を引く */
function ColumnFrame({ grid, cur, setCur, op }: {
  grid: string[][]; cur: Cursor; setCur: (c: Cursor) => void; op: ScratchOp;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-block', minWidth: 300 }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ width: 26, fontSize: 18, fontWeight: 800, color: '#7c8da6', textAlign: 'center' }}>
              {r === 1 ? op : ''}
            </span>
            <div style={{
              display: 'flex', gap: 2,
              borderBottom: r === 1 ? '3px solid #0f2540' : 'none',
              paddingBottom: r === 1 ? 3 : 0,
            }}>
              {row.map((v, c) => (
                <div key={c} onClick={() => setCur({ row: r, col: c })}
                  style={S.cell(cur.row === r && cur.col === c) as React.CSSProperties}>{v}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** わり算。かぎかっこの形（わる数 ⌐ わられる数、上に商） */
function DivisionFrame({ grid, cur, setCur }: {
  grid: string[][]; cur: Cursor; setCur: (c: Cursor) => void;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-block', minWidth: 300 }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            {/* 左の欄はわる数を書くところ。1行目（商）と2行目（わられる数）だけ使う */}
            <div style={{
              width: 60, display: 'flex', justifyContent: 'flex-end',
              borderRight: r === 1 ? '2px solid #0f2540' : 'none',
              paddingRight: 4,
            }}>
              {r === 1 && (
                <div onClick={() => setCur({ row: r, col: 0 })}
                  style={S.cell(cur.row === r && cur.col === 0) as React.CSSProperties}>{row[0]}</div>
              )}
            </div>
            {/*
              かぎ（わられる数の上の線）だけを引く。
              途中のひき算の線は引かない——決まった位置に引いてしまうと、
              実際の筆算とずれた場所に線があることになり、かえって迷わせる。
              どこで区切るかは、子どもが数を書きながら決める。
            */}
            <div style={{
              display: 'flex', gap: 2,
              borderTop: r === 1 ? '3px solid #0f2540' : 'none',
              paddingTop: r === 1 ? 3 : 0,
            }}>
              {row.slice(1).map((v, i) => {
                const c = i + 1;
                return (
                  <div key={c} onClick={() => setCur({ row: r, col: c })}
                    style={S.cell(cur.row === r && cur.col === c) as React.CSSProperties}>{v}</div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#8496ad', margin: '6px 0 0' }}>
        上の だんが 商、かぎの 左が わる数、右が わられる数だよ。
      </p>
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
          padding: '8px 16px',
          fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        }}>
        📝 {open ? 'けいさんらんを とじる' : label}
      </button>
      {open && <ScratchPad {...rest} />}
    </div>
  );
}
