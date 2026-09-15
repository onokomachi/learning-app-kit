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
import { getDeviceKey } from './device.js';

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

/** 同期対象の行に変換する。カタログと同じ app_id / skill_id をそのまま使う。 */
export function toRows(appId: string, deviceKey: string, state: SyncableState) {
  const mastery = Object.entries(state.mastery ?? {}).map(([skillId, m]) => ({
    device_key: deviceKey,
    app_id: appId,
    skill_id: skillId,
    attempts: m.attempts,
    corrects: m.corrects,
    perfect_streak: m.perfectStreak ?? 0,
    box: state.review?.[skillId]?.box ?? null,
    next_due_ts: state.review?.[skillId]?.nextDueTs ?? null,
    last_ts: state.review?.[skillId]?.lastTs ?? null,
  }));
  return mastery;
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
    const rows = toRows(appId, getDeviceKey(), state);
    if (rows.length === 0) return;
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/skill_state?on_conflict=device_key,app_id,skill_id`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(rows),
      });
      onSync?.(res.ok ? { ok: true, pushed: rows.length } : { ok: false, pushed: 0, error: `HTTP ${res.status}` });
    } catch (e) {
      // 同期の失敗で学習を止めない。次の書き込みでまた送られる
      onSync?.({ ok: false, pushed: 0, error: (e as Error).message });
    }
  };

  return {
    getItem: localAdapter.getItem,
    removeItem: localAdapter.removeItem,
    setItem: (name, value) => {
      localAdapter.setItem(name, value);   // 先に端末へ確実に書く
      pending = value;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flush(), debounceMs);
    },
  };
}
