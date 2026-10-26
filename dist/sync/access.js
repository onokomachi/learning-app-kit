/** 子ども用ハブ（SOL）。閉じた単元アプリの「SOL に もどる」に使う */
export const SOL_URL = 'https://class-portal-kids.vercel.app';
async function rpc(config, fn, body) {
    const { supabaseUrl, supabaseKey } = config;
    if (!supabaseUrl || !supabaseKey)
        return null;
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
            method: 'POST',
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok)
            return null;
        return (await res.json());
    }
    catch {
        return null;
    }
}
/** 自分の学級で閉じている単元の app_id。読めなければ null（＝開いている扱い） */
export async function fetchClosedApps(config, studentId) {
    const r = await rpc(config, 'my_closed_apps', { p_student_id: studentId });
    return r ? new Set(r) : null;
}
/** このアプリ（location.origin）が、その子の学級で開いているか。分からなければ true */
export async function checkAppOpen(config, studentId, origin) {
    const r = await rpc(config, 'app_open_for', { p_student_id: studentId, p_origin: origin });
    return r !== false;
}
//# sourceMappingURL=access.js.map