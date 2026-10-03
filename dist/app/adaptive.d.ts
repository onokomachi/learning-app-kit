/**
 * おまかせモード（適応難易度）の決まり。React に依存しない純粋関数だけを置く。
 *
 * - 始めるレベル: 前から順に、習熟度 0.7 以上のレベルを飛ばす（とちゅうで足りないレベルがあればそこから）
 * - とちゅう: 2問続けてノーミスで1つ上へ、2問続けてミスで1つ下へ
 *
 * **習熟度は「記録に残した skillId」で引く。** レベルの ID と記録の skillId が同じアプリが多いが、
 * 「レベルは '2-1'、記録は 'hissan-2-1'」のようにちがうモジュールもある。
 * そのときは toSkillId で記録の名前に直して渡す。以前は全アプリが prefix を必ず足していたため、
 * ID がすでに 'compare-basic' のアプリでは 'compare-compare-basic' を引いてしまい、
 * 開始レベルがいつも最初になっていた。
 */
export declare function recommendStart(getMastery: (skillId: string) => number, levelIds: readonly string[], toSkillId?: (levelId: string) => string): number;
/** 1問ごとの状態（連続ノーミス・連続ミスの数） */
export interface AdaptiveStep {
    index: number;
    perfectRun: number;
    missRun: number;
    leveledUp: boolean;
}
/** 1問の結果から、次のレベルの位置を決める */
export declare function nextAdaptiveIndex(s: AdaptiveStep, perfect: boolean, total: number): AdaptiveStep;
//# sourceMappingURL=adaptive.d.ts.map