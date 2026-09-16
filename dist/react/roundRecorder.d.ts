/**
 * 1問（1ラウンド）の記録を取る。
 *
 * これまでの記録は「最終的に正解までやり切ったとき」に1件だけ作られ、
 * 途中で何回まちがえたかは捨てられていた。残るのは「一発正解だったか」の真偽だけ。
 * しかも**正解までたどりつかずに離れた問題はどこにも残らない**——
 * できなかった問題ほど記録から消える、という状態だった。
 *
 * そのため「正答率」と呼べるのはラウンド単位の一発正解率までで、
 * 問題単位の実力も、つまずきの深さも数値にできなかった。
 *
 * ここが引き受けるのは3つ。
 *   1. まちがえた回数を数える
 *   2. できたときに1件記録する（まちがえた回数つき）
 *   3. **できないまま画面を離れたときにも1件記録する**（とちゅうでやめた印つき）
 *
 * 中身は React に依存しない `createRoundRecorder` に置いてある。
 * フックはそれを画面の寿命に結びつけるだけ——そうしておくと、
 * 記録の条件（二重記録の防止、触っていないときは残さない等）を
 * Reactを動かさずにテストできる。
 */
/** アプリのストアに渡す1件。アプリ側の ResultRecord から id と ts を除いた形にそろえる。 */
export interface RoundRecord {
    moduleId: string;
    skillId: string;
    label: string;
    correct: boolean;
    /** その問題で何回まちがえたか。0なら一発正解 */
    mistakes: number;
    /** 正解までたどりつかずに離れたか */
    abandoned?: boolean;
    /** 本番テストの答案など、アプリ固有の追加情報 */
    detail?: unknown;
}
export interface RoundRecorderOptions {
    moduleId: string;
    skillId: string;
    /** アプリのストアの記録関数。useProgressStore(s => s.recordResult) をそのまま渡す */
    record: (rec: RoundRecord) => void;
    /** とちゅうでやめたときに残すラベル。問題文が分かっていれば渡す */
    abandonLabel?: () => string;
    /**
     * まだ1回も答えていないうちに離れた場合も記録するか。既定は false。
     * 「開いただけで閉じた」を「できなかった問題」として数えないため。
     */
    recordUntouched?: boolean;
}
export interface RoundRecorder {
    /** まちがえたときに呼ぶ */
    mistake: () => void;
    /** できたときに呼ぶ。以後は何度呼んでも、離れても、二重に記録されない */
    finish: (label: string, extra?: {
        detail?: unknown;
    }) => void;
    /** 画面を離れるときに呼ぶ。できていなければ「とちゅうでやめた」として1件残す */
    leave: () => void;
    /** いまの誤答回数 */
    count: () => number;
}
/** React を使わない本体。テストはこちらを直接ためす。 */
export declare function createRoundRecorder(getOptions: () => RoundRecorderOptions): RoundRecorder;
//# sourceMappingURL=roundRecorder.d.ts.map