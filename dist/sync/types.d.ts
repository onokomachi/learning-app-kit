/**
 * 同期する状態の形。
 *
 * 全単元アプリの progressStore が共通して持っている部分だけを扱う。
 * アプリ固有のフィールド（bestTestOmote / masteredModules など）には触れない
 * ——触ると、アプリを1つ足すたびにこのファイルを直すことになるため。
 */
import type { MasteryLike, ReviewState } from '../review/index.js';
export type { MasteryLike };
export type ReviewLike = ReviewState;
export interface LogLike {
    ts: number;
    skillId: string;
    moduleId: string;
    correct: boolean;
}
/** zustand persist が保存している中身のうち、同期対象の部分。 */
export interface SyncableState {
    mastery?: Record<string, MasteryLike>;
    review?: Record<string, ReviewLike>;
    logs?: LogLike[];
}
export interface SyncConfig {
    /** カタログの app_id と一致させる。例: 'suihei' */
    appId: string;
    /** Supabase の URL。未設定なら同期は行わない（＝今までどおり端末内だけで動く） */
    supabaseUrl?: string;
    /** Supabase の publishable key（公開して良いキー。secret key は絶対に置かない） */
    supabaseKey?: string;
    /** 書き込みをまとめる待ち時間(ms)。既定 3000 */
    debounceMs?: number;
    /** 同期の成否を受け取る（デバッグ用。既定は何もしない） */
    onSync?: (result: {
        ok: boolean;
        pushed: number;
        error?: string;
    }) => void;
}
//# sourceMappingURL=types.d.ts.map