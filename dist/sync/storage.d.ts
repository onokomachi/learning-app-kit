/**
 * オフラインファーストの StateStorage。
 *
 * 設計の要点は「localStorage が正本であること」。
 * 読み出しは必ず localStorage から同期的に返し、Supabase へは書いたあとで
 * 非同期に送るだけ。これにより:
 *   - ネットが切れても学習は今までどおり続く（子どもの画面は何も変わらない）
 *   - Supabase が落ちていても、止まるのは「先生に届くこと」だけ
 *   - zustand のストアもコンポーネントも一切改修しなくてよい
 *
 * Phase 1 は push 専用（端末 → サーバー）。サーバーから引き戻す pull は入れていない。
 * 端末をまたいだ引きつぎは、認証を入れる Phase 2 の仕事にする。
 * そうすることで、この段階では競合解決を一切考えなくて済む。
 */
import type { StateStorage } from './state-storage.js';
import type { SyncConfig, SyncableState } from './types.js';
/** 端末内だけで完結する保存。Supabase を設定していないときはこれだけが動く。 */
export declare const localAdapter: StateStorage;
/** persist が保存している文字列から、同期対象の部分だけ取り出す。壊れていたら null。 */
export declare function parseSyncable(raw: string | null): SyncableState | null;
/** 同期対象の行に変換する。カタログと同じ app_id / skill_id をそのまま使う。 */
export declare function toRows(appId: string, deviceKey: string, state: SyncableState): {
    device_key: string;
    app_id: string;
    skill_id: string;
    attempts: number;
    corrects: number;
    perfect_streak: number;
    box: number | null;
    next_due_ts: number | null;
    last_ts: number | null;
}[];
/**
 * Supabase へ送る StateStorage を作る。
 * supabaseUrl / supabaseKey を渡さなければ、localAdapter と同じ挙動になる
 * ——つまり「設定し忘れたら壊れる」のではなく「今までどおり動く」。
 */
export declare function createSyncedStorage(config: SyncConfig): StateStorage;
//# sourceMappingURL=storage.d.ts.map