/**
 * 自分の記録を取る。まだ名乗っていなければ空で返す（エラーにしない）。
 * サーバは渡された児童IDの行しか返さないので、他人の記録は取れない。
 */
export async function fetchMyProgress(config, studentId) {
    const { supabaseUrl, supabaseKey } = config;
    if (!supabaseUrl || !supabaseKey)
        return { ok: true, rows: [] };
    if (!studentId)
        return { ok: true, rows: [] };
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/my_skill_state`, {
            method: 'POST',
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ p_student_id: studentId }),
        });
        if (!res.ok)
            return { ok: false, message: `よみこめませんでした (${res.status})` };
        const rows = (await res.json());
        return { ok: true, rows: Array.isArray(rows) ? rows : [] };
    }
    catch {
        return { ok: false, message: 'ネットにつながっていないようです' };
    }
}
/** 復習の期限が来ているものを、期限超過が大きい順に返す。 */
export function dueFromRows(rows, now = Date.now()) {
    return rows
        .filter((r) => r.next_due_ts != null && r.next_due_ts <= now)
        .sort((a, b) => (a.next_due_ts ?? 0) - (b.next_due_ts ?? 0));
}
//# sourceMappingURL=pull.js.map