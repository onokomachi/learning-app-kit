export type PlayMode = 'solo' | 'duo';
/** 1度答えてから、もう一度聞くまで（1コマ分） */
export declare const PLAY_MODE_WINDOW_MS: number;
/** 平日の 8:40〜15:15 か */
export declare function isSchoolTime(d?: Date): boolean;
type Listener = (mode: PlayMode | null) => void;
export declare function subscribePlayMode(cb: Listener): () => void;
/** いま有効な選択。まだ聞いていない／45分たった → null */
export declare function currentPlayMode(now?: number): PlayMode | null;
/**
 * いま聞くべきか。学級コードあり・授業の時間・まだ答えていない（または45分たった）とき。
 */
export declare function needsPlayModeAsk(now?: number): boolean;
/**
 * 選ぶ（切り替える）。ここから45分覚える。
 * ペア区間は「選んだ時刻から、切り替えるか45分たつまで」。
 */
export declare function setPlayMode(mode: PlayMode, now?: number): void;
/**
 * 実力を測る場面（本番テスト・実力の階段など）に入るときに呼ぶ。
 * ペアのままなら、ここでソロに切り替える。
 */
export declare function forceSolo(now?: number): boolean;
/** その時刻にペアだったかを判定する関数を返す（区間は1回だけ読む） */
export declare function pairChecker(): (ts: number) => boolean;
export {};
//# sourceMappingURL=playMode.d.ts.map