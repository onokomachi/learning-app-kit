import { getDeviceKey } from './device.js';
/**
 * 学習記録を学級ポータルへ送る。
 * supabaseUrl / supabaseKey が無ければ何もしない（設定し忘れても壊れない）。
 */
export async function pushSkillState(config, rows) {
    const { appId, supabaseUrl, supabaseKey } = config;
    if (!supabaseUrl || !supabaseKey)
        return { ok: true, pushed: 0 };
    if (rows.length === 0)
        return { ok: true, pushed: 0 };
    // 壊れた行はここで落とす。1件の不正で全体を失敗させない
    const valid = rows.filter((r) => r.skill_id && r.attempts >= 0 && r.corrects >= 0 && r.corrects <= r.attempts);
    if (valid.length === 0)
        return { ok: true, pushed: 0 };
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
                p_rows: valid.map((r) => ({
                    skill_id: r.skill_id,
                    attempts: r.attempts,
                    corrects: r.corrects,
                    perfect_streak: r.perfect_streak ?? 0,
                    box: r.box ?? null,
                    next_due_ts: r.next_due_ts ?? null,
                    last_ts: r.last_ts ?? null,
                })),
            }),
        });
        if (!res.ok)
            return { ok: false, pushed: 0, error: `HTTP ${res.status}` };
        return { ok: true, pushed: Number(await res.text()) };
    }
    catch (e) {
        return { ok: false, pushed: 0, error: e.message };
    }
}
/**
 * 送信をまとめる。何度呼んでも、最後の呼び出しから wait ミリ秒たってから1回だけ送る。
 * 画面の操作ごとに呼んでよい形にするためのもの。
 */
export function createPusher(config, wait = 3000) {
    let timer;
    let latest = [];
    return (rows, onDone) => {
        latest = rows;
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(() => { void pushSkillState(config, latest).then((r) => onDone?.(r)); }, wait);
    };
}
//# sourceMappingURL=push.js.map