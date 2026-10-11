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
export declare function toInt(s: string | undefined): number | null;
/** 0 以上の整数（空は null）。0 を許す欄（くり下げ前の分子 など）用 */
export declare function toInt0(s: string | undefined): number | null;
/** a の倍数を、小さい順に count 個（a×1, a×2, …） */
export declare function multiplesOf(a: number, count: number): number[];
/** 両方の行で ○ を つけた 数（＝同じ数にみつけた）。小さい順 */
export declare function sharedCircled(rowA: readonly number[], rowB: readonly number[]): number[];
/**
 * 通分の「×k」。分母 d を L にするために かける数。
 * L が d の倍数でないときは null（その L では、この分数の分母を L にできない）。
 */
export declare function scaleFactor(d: number, L: number): number | null;
export type DivResult = {
    ok: true;
    n: number;
    d: number;
} | {
    ok: false;
    reason: string;
};
/** 約分: 分子と分母を g でわる。どちらかが わりきれないときは理由を返す */
export declare function applyDivisor(n: number, d: number, g: number): DivResult;
/** 約分をつづけた あとの 分数（割った数の列を順に当てる）。失敗した列は、そこまでで止める */
export declare function reduceChain(n: number, d: number, gs: readonly number[]): {
    stages: {
        n: number;
        d: number;
        g: number | null;
    }[];
};
export type Mixed = {
    w: number;
    n: number;
    d: number;
};
/**
 * 1 くり下げる: 整数を 1 へらし、その 1 を 分母 d の分数（d/d）にして 分数に たす。
 *   w と n/d → (w−1) と (n+d)/d    （整数だけ のときは n = 0）
 * 整数が 0 のときは くり下げられない（null）。
 */
export declare function borrowOne(m: Mixed): Mixed | null;
/** 「d × q ＋ r」。わり算の たしかめ（子どもが入れた q・r から作る。正誤は言わない） */
export declare function divCheck(d: number, q: number, r: number): number;
//# sourceMappingURL=fractionPadLogic.d.ts.map