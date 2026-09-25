/**
 * けいさんらんの「形」を決める部分（画面に依存しない）。
 *
 * 子どもが打った2つの数から、位のそろった筆算のマス目を組み立てる。
 * 紙に書くときと同じく、式を立てたあとは**空いたマスの無い、詰めた形**で計算させる。
 *
 *   たし算・ひき算 … 小数点（一の位）で たてに そろえる
 *   かけ算         … 右で そろえる（小数点は そろえない。答えの点は子どもが打つ）
 *   わり算         … 商・わる数・わられる数の かぎ形。下に「かける・ひく」の段
 *
 * 採点はしない。ここが知っているのは「どこにマスを置くか」と
 * 「10 かりたら どの数字がどう変わるか」だけで、答えは知らない。
 */

export type ScratchOp = '+' | '-' | '×' | '÷';

export interface Num {
  /** 整数部（先頭の0は1つにまとめる。0.5 なら "0"） */
  int: string;
  /** 小数部（無ければ ""） */
  dec: string;
}

/** 1つの数として読めるか。".5" や "1.2.3" は読めない */
export function parseNum(s: string): Num | null {
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [i = '', d = ''] = s.split('.');
  return { int: i.replace(/^0+(?=\d)/, ''), dec: d };
}

export const numValue = (n: Num) => Number(n.dec ? `${n.int}.${n.dec}` : n.int);

/** 1マスの中身。fixed は問題の数（書きかえられない）、helper は ひき算で補う うすい0 */
export type Fixed = { digit: string; helper?: boolean } | null;

export interface FixedRow {
  cells: Fixed[];
  /** この列の すぐ右に 小数点を打つ（無ければ null） */
  pointAfter: number | null;
}

/** 子どもが書きこむ段。start..end の列にだけマスがある */
export interface InputRow {
  id: string;
  start: number;
  end: number;
  /** 1マスに入る けた数。2なら十の位が くり上がりとして 左のマスに 小さく出る */
  max: 1 | 2;
  /** 小数点を 子どもが打てる段か */
  freePoint: boolean;
  /** 小数点が決まっている段（たし算・ひき算の答え） */
  fixedPointAfter: number | null;
  /** この段の下に線を引く（わり算の「かける」の段） */
  lineBelow?: boolean;
  /** 10 を かりる元になれる段か（わり算の「ひく」の段） */
  borrowable?: boolean;
}

export interface ColumnLayout {
  kind: 'column';
  width: number;
  top: FixedRow;
  bottom: FixedRow;
  /** 上の数の段で 10 を かりられるか（ひき算だけ） */
  borrowTop: boolean;
  /** 部分積の段（かけ算で かける数が2けた以上のとき）。線の下に並ぶ */
  partials: InputRow[];
  /** 答えの段 */
  answer: InputRow;
  /** 部分積の下にもう1本線を引いて、答えの段を置くか */
  sumLine: boolean;
}

export interface DivisionLayout {
  kind: 'division';
  width: number;
  divisor: string;
  dividend: FixedRow;
  quotient: InputRow;
  /** かける・ひく を1組として並べる */
  steps: { product: InputRow; diff: InputRow }[];
}

export type Layout = ColumnLayout | DivisionLayout;

export type LayoutResult = { ok: true; layout: Layout } | { ok: false; reason: string };

const blank = (w: number): Fixed[] => Array.from({ length: w }, () => null);

/** 数字の列を、右端を end 列目にそろえて置く */
function placeRight(digits: string, end: number, width: number): Fixed[] {
  const cells = blank(width);
  for (let i = 0; i < digits.length; i++) cells[end - (digits.length - 1 - i)] = { digit: digits[i]! };
  return cells;
}

function addSubLayout(a: Num, b: Num, op: '+' | '-'): LayoutResult {
  if (op === '-' && numValue(a) < numValue(b)) {
    return { ok: false, reason: '上の数が 下の数より 小さいよ。大きい数を 上に 書こう。' };
  }
  // たし算は いちばん左で くり上がることがあるので、1列 よけいに とる
  const intW = Math.max(a.int.length, b.int.length) + (op === '+' ? 1 : 0);
  const decW = Math.max(a.dec.length, b.dec.length);
  const width = intW + decW;
  const pointAfter = decW > 0 ? intW - 1 : null;

  const row = (n: Num, helper: boolean): FixedRow => {
    const cells = blank(width);
    for (let i = 0; i < n.int.length; i++) cells[intW - n.int.length + i] = { digit: n.int[i]! };
    for (let i = 0; i < decW; i++) {
      if (i < n.dec.length) cells[intW + i] = { digit: n.dec[i]! };
      // ひき算で 上の数の小数のけたが 足りないとき（5 − 1.23）は、うすい0で うめる。
      // 0 が無いと、そこへ 10 を かりてくることができない
      else if (helper) cells[intW + i] = { digit: '0', helper: true };
    }
    return { cells, pointAfter: n.dec || (helper && decW > 0) ? pointAfter : null };
  };

  return {
    ok: true,
    layout: {
      kind: 'column', width,
      top: row(a, op === '-'), bottom: row(b, false),
      borrowTop: op === '-',
      partials: [],
      answer: {
        id: 'answer', start: 0, end: width - 1,
        max: op === '+' ? 2 : 1, freePoint: false, fixedPointAfter: pointAfter,
      },
      sumLine: false,
    },
  };
}

function mulLayout(a: Num, b: Num): LayoutResult {
  const aDigits = a.int + a.dec;
  const bDigits = b.int + b.dec;
  // 0.25 の 0 のような、先頭の0は かけない
  const aSig = aDigits.replace(/^0+(?=\d)/, '');
  const bSig = bDigits.replace(/^0+(?=\d)/, '');
  const width = Math.max(aDigits.length, bDigits.length, aSig.length + bSig.length);
  const end = width - 1;
  const fixed = (n: Num, digits: string): FixedRow => ({
    cells: placeRight(digits, end, width),
    pointAfter: n.dec ? end - n.dec.length : null,
  });

  // かける数が1けたなら 答えの段だけ。2けた以上なら 部分積を並べて、下で たす
  const partials: InputRow[] = bSig.length === 1 ? [] : Array.from(bSig, (_, i) => ({
    id: `p${i}`,
    start: Math.max(0, end - i - aSig.length), end: end - i,
    max: 2 as const, freePoint: false, fixedPointAfter: null,
  }));
  const answer: InputRow = {
    id: 'answer',
    start: Math.max(0, end - (aSig.length + bSig.length) + 1), end,
    max: 2, freePoint: true, fixedPointAfter: null,
  };
  return {
    ok: true,
    layout: {
      kind: 'column', width,
      top: fixed(a, aDigits), bottom: fixed(b, bDigits),
      borrowTop: false, partials, answer, sumLine: partials.length > 0,
    },
  };
}

/** わり算の「かける・ひく」を何組 出しておくか（あとから ふやせる） */
export const DIV_STEPS_MIN = 2;
export const DIV_STEPS_MAX = 8;

export function divisionSteps(width: number, count: number): DivisionLayout['steps'] {
  return Array.from({ length: count }, (_, k) => ({
    product: {
      id: `m${k}`, start: 0, end: width - 1, max: 2 as const,
      freePoint: false, fixedPointAfter: null, lineBelow: true,
    },
    diff: {
      id: `d${k}`, start: 0, end: width - 1, max: 1 as const,
      freePoint: false, fixedPointAfter: null, borrowable: true,
    },
  }));
}

function divLayout(a: Num, b: Num, extraZeros: number, steps: number): LayoutResult {
  if (numValue(b) === 0) return { ok: false, reason: '0 で わることは できないよ。' };
  // わり進むときは、わられる数の右に 0 を つけたす（整数なら 小数点も つく）
  const dec = a.dec + '0'.repeat(extraZeros);
  const digits = a.int + dec;
  const width = digits.length;
  return {
    ok: true,
    layout: {
      kind: 'division', width,
      divisor: b.dec ? `${b.int}.${b.dec}` : b.int,
      dividend: {
        cells: digits.split('').map((d, i) => ({ digit: d, helper: i >= a.int.length + a.dec.length })),
        pointAfter: dec ? a.int.length - 1 : null,
      },
      quotient: { id: 'q', start: 0, end: width - 1, max: 1, freePoint: true, fixedPointAfter: null },
      steps: divisionSteps(width, steps),
    },
  };
}

export interface LayoutInput {
  op: ScratchOp;
  a: string;
  b: string;
  /** わり算で、わられる数に つけたした 0 の数 */
  extraZeros?: number;
  /** わり算の「かける・ひく」の組の数 */
  divSteps?: number;
}

export function buildLayout({ op, a, b, extraZeros = 0, divSteps }: LayoutInput): LayoutResult {
  const na = parseNum(a);
  const nb = parseNum(b);
  if (!na) return { ok: false, reason: op === '÷' ? 'わられる数を 入れてね。' : '上の数を 入れてね。' };
  if (!nb) return { ok: false, reason: op === '÷' ? 'わる数を 入れてね。' : '下の数を 入れてね。' };
  if (op === '+' || op === '-') return addSubLayout(na, nb, op);
  if (op === '×') return mulLayout(na, nb);
  const steps = divSteps ?? Math.max(DIV_STEPS_MIN, Math.min(DIV_STEPS_MAX, na.int.length));
  return divLayout(na, nb, extraZeros, Math.min(steps, DIV_STEPS_MAX));
}

/* ------------------------------------------------------------------ */
/* 10 を かりる（くり下がり）                                            */
/* ------------------------------------------------------------------ */

export interface BorrowView {
  /** いまの値（かりたあと）。数字の無い列は null */
  values: (number | null)[];
  /** もとの数字から 変わった列（斜線を引いて、上に小さく 新しい数を書く） */
  changed: boolean[];
}

/**
 * かりる操作を順に当てはめる。ops は「10 がほしい列」の並び。
 *
 * ほしい列の すぐ左から見ていき、0 でない数字の列から 1 かりる。
 * とちゅうの 0 は 9 になる（300 の一の位で かりると 3→2、0→9、0→10）。
 * 左に かりられる数字が無い操作は 何もしない。
 */
export function applyBorrows(base: readonly (number | null)[], ops: readonly number[]): BorrowView {
  const values = [...base];
  const changed = base.map(() => false);
  for (const t of ops) {
    if (values[t] == null) continue;
    let j = t - 1;
    while (j >= 0 && values[j] === 0) j--;
    if (j < 0 || values[j] == null) continue;
    // 0 の列の手前で、数字の無い列に ぶつかったら かりられない
    let gap = false;
    for (let k = j + 1; k < t; k++) if (values[k] == null) gap = true;
    if (gap) continue;
    values[j] = values[j]! - 1; changed[j] = true;
    for (let k = j + 1; k < t; k++) { values[k] = values[k]! + 9; changed[k] = true; }
    values[t] = values[t]! + 10; changed[t] = true;
  }
  return { values, changed };
}

/** その列で 10 を かりられるか（いまの状態から） */
export function canBorrow(base: readonly (number | null)[], ops: readonly number[], t: number): boolean {
  const before = applyBorrows(base, ops).values;
  const after = applyBorrows(base, [...ops, t]).values;
  return before[t] !== after[t];
}

/**
 * 列をおしたときの操作。すでに 10 をかりた列なら、その操作と それより後の操作を 取り消す
 * （あとの操作は 前の操作の結果に たよっているので、いっしょに もどす）。
 * かりられない列なら ops は そのまま。
 */
export function toggleBorrow(base: readonly (number | null)[], ops: readonly number[], t: number): number[] {
  const at = ops.indexOf(t);
  if (at >= 0) return ops.slice(0, at);
  return canBorrow(base, ops, t) ? [...ops, t] : [...ops];
}

/** 段のマスの文字列から、かりる計算の元になる値を作る（空は null） */
export function rowValues(cells: readonly string[]): (number | null)[] {
  return cells.map((c) => (c === '' ? null : Number(c.slice(-1))));
}

/**
 * 1マスに数字を入れる。max まで入ったら、つぎの1文字で 入れ直しになる
 * （まちがえて入れたとき、消さずに そのまま打ち直せる）。
 */
export function typeDigit(buf: string, d: string, max: 1 | 2): string {
  return buf.length >= max ? d : buf + d;
}

/**
 * 2けた入ったマスの、くり上がりの数（十の位）。
 * 左どなりのマスに 小さく出す。いちばん左のマスは 左どなりが無いので 2けたにしない。
 */
export function carryOf(buf: string): string | null {
  return buf.length >= 2 ? buf.slice(0, -1) : null;
}

/* ------------------------------------------------------------------ */
/* 0 を消す くふう（わり算）                                             */
/* ------------------------------------------------------------------ */

/** 末尾に並ぶ 0 の数（整数だけ。小数には使わない） */
export function trailingZeros(s: string): number {
  if (!/^\d+$/.test(s)) return 0;
  const m = s.replace(/^0+(?=\d)/, '').match(/0+$/);
  return m && m[0].length < s.length ? m[0].length : 0;
}

/** わられる数と わる数から、いっしょに消せる 0 の数 */
export function commonZeros(a: string, b: string): number {
  return Math.min(trailingZeros(a), trailingZeros(b));
}
