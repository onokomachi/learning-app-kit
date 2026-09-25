import { type ScratchOp } from './scratchLayout.js';
export type { ScratchOp } from './scratchLayout.js';
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
    initial?: {
        op: ScratchOp;
        a: string;
        b: string;
    };
}
export declare function ScratchPad({ defaultOp, ops, decimal, initial, }: ScratchPadProps): import("react").JSX.Element;
/**
 * ボタンを押したときだけ開く「けいさんらん」。
 *
 * **はじめは閉じておく。** 簡単な設問では要らないので、いつも開いていると
 * 画面が煩雑になり、本来の問題が下に押しやられる。
 */
export declare function ScratchPadToggle(props: ScratchPadProps & {
    label?: string;
}): import("react").JSX.Element;
//# sourceMappingURL=ScratchPad.d.ts.map