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
 *
 * 送信先はテーブルではなく RPC(sync_skill_state)。テーブルへ直接 upsert すると
 * PostgreSQL の ON CONFLICT DO UPDATE が RLS 下で SELECT ポリシーを要求してしまい、
 * それを与えると「児童端末が他人のデータを読めない」保証が壊れるため
 * （詳細は master-DB: techspecs/learning-record-store-schema）。
 */
import type { StateStorage } from './state-storage.js';
import type { SyncConfig, SyncableState } from './types.js';
import { getDeviceKey } from './device.js';
import { getStudent } from './student.js';

/** 端末内だけで完結する保存。Supabase を設定していないときはこれだけが動く。 */
export const localAdapter: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      // プライベートブラウジング等で localStorage が使えないことがある。
      // 記録が残らないだけで学習は続けられるようにする。
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* 容量超過などは黙って無視（児童端末でクラッシュさせない） */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* noop */
    }
  },
};

/** persist が保存している文字列から、同期対象の部分だけ取り出す。壊れていたら null。 */
export function parseSyncable(raw: string | null): SyncableState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: SyncableState };
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

/**
 * 送信する行に変換する。skill_id はカタログと同じ文字列をそのまま使う。
 * device_key と app_id は RPC の引数で渡すので、各行には含めない。
 */
export function toRows(state: SyncableState) {
  return Object.entries(state.mastery ?? {}).map(([skillId, m]) => ({
    skill_id: skillId,
    attempts: m.attempts,
    corrects: m.corrects,
    perfect_streak: m.perfectStreak ?? 0,
    box: state.review?.[skillId]?.box ?? null,
    next_due_ts: state.review?.[skillId]?.nextDueTs ?? null,
    last_ts: state.review?.[skillId]?.lastTs ?? null,
  }));
}

/**
 * Supabase へ送る StateStorage を作る。
 * supabaseUrl / supabaseKey を渡さなければ、localAdapter と同じ挙動になる
 * ——つまり「設定し忘れたら壊れる」のではなく「今までどおり動く」。
 */
export function createSyncedStorage(config: SyncConfig): StateStorage {
  const { appId, supabaseUrl, supabaseKey, debounceMs = 3000, onSync } = config;
  if (!supabaseUrl || !supabaseKey) return localAdapter;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: string | null = null;

  const flush = async () => {
    const raw = pending;
    pending = null;
    const state = parseSyncable(raw);
    if (!state) return;
    const rows = toRows(state);
    if (rows.length === 0) return;
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/sync_skill_state`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_device_key: getDeviceKey(),
          p_app_id: appId,
          // 学級コードを入れていなければ null。サーバ側は端末単位で記録する
          p_student_id: getStudent()?.studentId ?? null,
          p_rows: rows,
        }),
      });
      // 関数は「実際に書き込めた件数」を返す。巻き戻し防止で弾かれた行はここに含まれない
      const accepted = res.ok ? Number(await res.text()) : 0;
      onSync?.(res.ok ? { ok: true, pushed: accepted } : { ok: false, pushed: 0, error: `HTTP ${res.status}` });
    } catch (e) {
      // 同期の失敗で学習を止めない。次の書き込みでまた送られる
      onSync?.({ ok: false, pushed: 0, error: (e as Error).message });
    }
  };

  const schedule = (value: string) => {
    pending = value;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flush(), debounceMs);
  };

  let sentOnStartup = false;

  return {
    removeItem: localAdapter.removeItem,

    /**
     * 読み出しは端末から。そのついでに、起動時の1回だけ、
     * すでに端末に溜まっている記録を送る。
     *
     * これが無いと「アプリを入れる前から使っていた子の記録」は、
     * その子が次に1問解くまでサーバに届かない。二度と開かなければ永久に届かない。
     * 送るのは常に全量なので、1回送れば端末の中身がそのまま反映される。
     */
    getItem: (name) => {
      const value = localAdapter.getItem(name);
      if (!sentOnStartup) {
        sentOnStartup = true;
        if (typeof value === 'string' && value) schedule(value);
      }
      return value;
    },

    setItem: (name, value) => {
      localAdapter.setItem(name, value);   // 先に端末へ確実に書く
      schedule(value);
    },
  };
}
