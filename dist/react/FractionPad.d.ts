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
        mixed?: {
            w: number;
            n: number;
            d: number;
        };
    };
}
export declare function FractionPad({ tools, initial }: FractionPadProps): import("react").JSX.Element;
/**
 * ボタンを押したときだけ開く「分数のけいさんらん」。
 * **はじめは閉じておく。** 簡単な設問では要らないので、いつも開いていると画面が煩雑になる。
 */
export declare function FractionPadToggle(props: FractionPadProps & {
    label?: string;
}): import("react").JSX.Element;
//# sourceMappingURL=FractionPad.d.ts.map