import { getDeviceKey } from './device.js';
import { getStudent } from './student.js';
/** 端末内だけで完結する保存。Supabase を設定していないときはこれだけが動く。 */
export const localAdapter = {
    getItem: (name) => {
        try {
            return localStorage.getItem(name);
        }
        catch {
            // プライベートブラウジング等で localStorage が使えないことがある。
            // 記録が残らないだけで学習は続けられるようにする。
            return null;
        }
    },
    setItem: (name, value) => {
        try {
            localStorage.setItem(name, value);
        }
        catch {
            /* 容量超過などは黙って無視（児童端末でクラッシュさせない） */
        }
    },
    removeItem: (name) => {
        try {
            localStorage.removeItem(name);
        }
        catch {
            /* noop */
        }
    },
};
/** persist が保存している文字列から、同期対象の部分だけ取り出す。壊れていたら null。 */
export function parseSyncable(raw) {
    if (!raw)
        return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed?.state ?? null;
    }
    catch {
        return null;
    }
}
/**
 * 送信する行に変換する。skill_id はカタログと同じ文字列をそのまま使う。
 * device_key と app_id は RPC の引数で渡すので、各行には含めない。
 */
export function toRows(state) {
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
export function createSyncedStorage(config) {
    const { appId, supabaseUrl, supabaseKey, debounceMs = 3000, onSync } = config;
    if (!supabaseUrl || !supabaseKey)
        return localAdapter;
    let timer;
    let pending = null;
    const flush = async () => {
        const raw = pending;
        pending = null;
        const state = parseSyncable(raw);
        if (!state)
            return;
        const rows = toRows(state);
        if (rows.length === 0)
            return;
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
        }
        catch (e) {
            // 同期の失敗で学習を止めない。次の書き込みでまた送られる
            onSync?.({ ok: false, pushed: 0, error: e.message });
        }
    };
    return {
        getItem: localAdapter.getItem,
        removeItem: localAdapter.removeItem,
        setItem: (name, value) => {
            localAdapter.setItem(name, value); // 先に端末へ確実に書く
            pending = value;
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(() => void flush(), debounceMs);
        },
    };
}
//# sourceMappingURL=storage.js.map