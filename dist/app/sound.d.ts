export interface Sound {
    /** 1ステップ正解などの軽い「ポン」 */
    playCorrect: () => void;
    /** 問題クリアの明るい上昇音 */
    playClear: () => void;
    /** レベルアップのファンファーレ */
    playLevelUp: () => void;
    /** やり直しをうながす やわらかい音（不快でない低めの短音） */
    playSoftTry: () => void;
}
export declare function createSound(isEnabled: () => boolean): Sound;
//# sourceMappingURL=sound.d.ts.map