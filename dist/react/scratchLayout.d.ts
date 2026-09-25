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
export declare function parseNum(s: string): Num | null;
export declare const numValue: (n: Num) => number;
/** 1マスの中身。fixed は問題の数（書きかえられない）、helper は ひき算で補う うすい0 */
export type Fixed = {
    digit: string;
    helper?: boolean;
} | null;
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
    steps: {
        product: InputRow;
        diff: InputRow;
    }[];
}
export type Layout = ColumnLayout | DivisionLayout;
export type LayoutResult = {
    ok: true;
    layout: Layout;
} | {
    ok: false;
    reason: string;
};
/** わり算の「かける・ひく」を何組 出しておくか（あとから ふやせる） */
export declare const DIV_STEPS_MIN = 2;
export declare const DIV_STEPS_MAX = 8;
export declare function divisionSteps(width: number, count: number): DivisionLayout['steps'];
export interface LayoutInput {
    op: ScratchOp;
    a: string;
    b: string;
    /** わり算で、わられる数に つけたした 0 の数 */
    extraZeros?: number;
    /** わり算の「かける・ひく」の組の数 */
    divSteps?: number;
}
export declare function buildLayout({ op, a, b, extraZeros, divSteps }: LayoutInput): LayoutResult;
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
export declare function applyBorrows(base: readonly (number | null)[], ops: readonly number[]): BorrowView;
/** その列で 10 を かりられるか（いまの状態から） */
export declare function canBorrow(base: readonly (number | null)[], ops: readonly number[], t: number): boolean;
/**
 * 列をおしたときの操作。すでに 10 をかりた列なら、その操作と それより後の操作を 取り消す
 * （あとの操作は 前の操作の結果に たよっているので、いっしょに もどす）。
 * かりられない列なら ops は そのまま。
 */
export declare function toggleBorrow(base: readonly (number | null)[], ops: readonly number[], t: number): number[];
/** 段のマスの文字列から、かりる計算の元になる値を作る（空は null） */
export declare function rowValues(cells: readonly string[]): (number | null)[];
/**
 * 1マスに数字を入れる。max まで入ったら、つぎの1文字で 入れ直しになる
 * （まちがえて入れたとき、消さずに そのまま打ち直せる）。
 */
export declare function typeDigit(buf: string, d: string, max: 1 | 2): string;
/**
 * 2けた入ったマスの、くり上がりの数（十の位）。
 * 左どなりのマスに 小さく出す。いちばん左のマスは 左どなりが無いので 2けたにしない。
 */
export declare function carryOf(buf: string): string | null;
/** 末尾に並ぶ 0 の数（整数だけ。小数には使わない） */
export declare function trailingZeros(s: string): number;
/** わられる数と わる数から、いっしょに消せる 0 の数 */
export declare function commonZeros(a: string, b: string): number;
//# sourceMappingURL=scratchLayout.d.ts.map