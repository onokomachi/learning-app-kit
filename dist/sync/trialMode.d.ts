/**
 * 体験版（2026-11-07 先生と決めた）。
 *
 * SOL の体験の入口（https://class-portal-kids.vercel.app/#trial）から開いたアプリは、URL の最後に #trial が付いてくる。
 * それを受け取ったタブは「体験中」になる：
 *   - 名乗っていない扱い（getStudent() が null）。名乗った端末でも、体験中は学級の記録・セーブにさわらない
 *   - 答えはサーバに送らない（回数だけ trial_hit で数える）
 *   - 使える画面は PRISM の「体験」設定（アプリごと・項目ごと）で決まる（portalConfig.ts の trialAllows）
 *
 * 覚えるのはタブの中だけ（sessionStorage）。タブを閉じる・「体験を おわる」で、ふつうにもどる。
 * #trial は受け取ったら URL から消す（ブックマーク・共有に残さない）。
 */
/** URL のハッシュに trial が入っているか（#trial ／ #trial=1 ／ #c=..&trial） */
export declare function hashHasTrial(hash: string): boolean;
/** このタブは体験中か。はじめて呼ばれたときに URL の #trial を受け取る */
export declare function isTrial(): boolean;
/** 体験を おわる（このタブを ふつうにもどして、読みなおす） */
export declare function endTrial(): void;
/** テスト用：覚えている状態を消す */
export declare function _resetTrialForTest(): void;
//# sourceMappingURL=trialMode.d.ts.map