export type ScratchOp = '+' | '-' | '×' | '÷';
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
export declare function ScratchPad({ defaultOp, ops, decimal, rows, }: ScratchPadProps): import("react").JSX.Element;
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