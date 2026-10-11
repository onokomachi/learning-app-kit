/**
 * 分数のけいさんらん（FractionPad）の、画面に依存しない部分。
 *
 * けいさんらんは「紙のノート」の代わり。**考えるのは子ども、書く手間を減らすのがこの道具**。
 * だから次の2つを分けている。
 *   - 子どもが決めること … 共通の分母は何か／何で約分するか／どこで くり下げるか／答えの数
 *   - 道具が かわりに やること … 倍数を ならべる／「×k」「÷g」の矢印と斜線／くり下げたあとの書き直し
 * 採点はしない。「合っている」「まちがい」は言わない（元の問題の入力らんが判定する）。
 */

/** 文字列を 1 以上の整数に。空・0・読めないものは null */
export function toInt(s: string | undefined): number | null {
  if (!s || !/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 ? n : null;
}

/** 0 以上の整数（空は null）。0 を許す欄（くり下げ前の分子 など）用 */
export function toInt0(s: string | undefined): number | null {
  if (s === undefined || s === '' || !/^\d+$/.test(s)) return null;
  return Number(s);
}

/** a の倍数を、小さい順に count 個（a×1, a×2, …） */
export function multiplesOf(a: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => a * (i + 1));
}

/** 両方の行で ○ を つけた 数（＝同じ数にみつけた）。小さい順 */
export function sharedCircled(rowA: readonly number[], rowB: readonly number[]): number[] {
  const b = new Set(rowB);
  return rowA.filter((v) => b.has(v)).sort((x, y) => x - y);
}

/**
 * 通分の「×k」。分母 d を L にするために かける数。
 * L が d の倍数でないときは null（その L では、この分数の分母を L にできない）。
 */
export function scaleFactor(d: number, L: number): number | null {
  if (d <= 0 || L <= 0 || L % d !== 0) return null;
  return L / d;
}

export type DivResult = { ok: true; n: number; d: number } | { ok: false; reason: string };

/** 約分: 分子と分母を g でわる。どちらかが わりきれないときは理由を返す */
export function applyDivisor(n: number, d: number, g: number): DivResult {
  if (!(g >= 2)) return { ok: false, reason: '2 以上の 数で わろう。' };
  if (n % g !== 0 && d % g !== 0) return { ok: false, reason: `${n} も ${d} も ${g} で わりきれないよ。` };
  if (n % g !== 0) return { ok: false, reason: `${n} は ${g} で わりきれないよ。分子と分母が どちらも われる 数で わろう。` };
  if (d % g !== 0) return { ok: false, reason: `${d} は ${g} で わりきれないよ。分子と分母が どちらも われる 数で わろう。` };
  return { ok: true, n: n / g, d: d / g };
}

/** 約分をつづけた あとの 分数（割った数の列を順に当てる）。失敗した列は、そこまでで止める */
export function reduceChain(n: number, d: number, gs: readonly number[]): { stages: { n: number; d: number; g: number | null }[] } {
  const stages: { n: number; d: number; g: number | null }[] = [{ n, d, g: null }];
  let cur = { n, d };
  for (const g of gs) {
    const r = applyDivisor(cur.n, cur.d, g);
    if (!r.ok) break;
    cur = { n: r.n, d: r.d };
    stages.push({ n: r.n, d: r.d, g });
  }
  return { stages };
}

export type Mixed = { w: number; n: number; d: number };

/**
 * 1 くり下げる: 整数を 1 へらし、その 1 を 分母 d の分数（d/d）にして 分数に たす。
 *   w と n/d → (w−1) と (n+d)/d    （整数だけ のときは n = 0）
 * 整数が 0 のときは くり下げられない（null）。
 */
export function borrowOne(m: Mixed): Mixed | null {
  if (m.w < 1 || m.d < 1) return null;
  return { w: m.w - 1, n: m.n + m.d, d: m.d };
}

/** 「d × q ＋ r」。わり算の たしかめ（子どもが入れた q・r から作る。正誤は言わない） */
export function divCheck(d: number, q: number, r: number): number {
  return d * q + r;
}
