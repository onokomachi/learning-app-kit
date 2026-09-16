import { getDeviceKey } from './device.js';
import { getStudent } from './student.js';
/** サーバ側の受け入れ上限と合わせる */
const MAX_EVENTS = 500;
const markKey = (appId) => `lak_sent_ts_${appId}`;
/**
 * どこまで送れたか（端末の時刻・ミリ秒）。
 * これ以降の出来事だけを送る。読めなければ0＝全部送る、で安全側に倒す。
 */
export function getSentMark(appId) {
    try {
        const v = Number(localStorage.getItem(markKey(appId)));
        return Number.isFinite(v) && v > 0 ? v : 0;
    }
    catch {
        return 0;
    }
}
export function setSentMark(appId, ts) {
    try {
        localStorage.setItem(markKey(appId), String(ts));
    }
    catch {
        /* 覚えられなくても動く。次回は同じ分を送り直すだけで、重複はサーバが弾く */
    }
}
/**
 * マークを消す＝次回に全部送り直す。
 * 名乗りが後から決まったときに使う。すでに送った出来事にも
 * 「誰のものか」を付け直すには、もう一度通す必要があるため。
 */
export function clearSentMark(appId) {
    try {
        localStorage.removeItem(markKey(appId));
    }
    catch {
        /* noop */
    }
}
/**
 * 端末のログを、まだ送っていない分だけ送信用に変換する。
 * 古い順に並べて返すので、途中で打ち切られても「古い方から確実に埋まる」。
 */
export function toEventRows(logs, sinceTs) {
    if (!logs || logs.length === 0)
        return [];
    const rows = [];
    for (const l of logs) {
        if (!l || typeof l.ts !== 'number' || l.ts <= sinceTs)
            continue;
        if (!l.skillId)
            continue;
        rows.push({
            // idを持たない古いアプリでも、時刻とスキルの組でほぼ一意になる
            event_id: String(l.id ?? `${l.ts}-${l.skillId}`).slice(0, 64),
            skill_id: l.skillId,
            module_id: l.moduleId,
            label: l.label,
            correct: !!l.correct,
            mistakes: Math.max(0, Number(l.mistakes ?? 0)) || 0,
            abandoned: !!l.abandoned,
            ts: l.ts,
            ...(l.detail ? { detail: l.detail } : {}),
        });
    }
    rows.sort((a, b) => a.ts - b.ts);
    return rows.slice(0, MAX_EVENTS);
}
/**
 * 出来事を送る。設定が無ければ何もしない（設定し忘れても壊れない）。
 * 送信の失敗で学習を止めないので、例外は投げない。
 */
export async function pushEvents(config, rows) {
    const { appId, supabaseUrl, supabaseKey } = config;
    if (!supabaseUrl || !supabaseKey)
        return { ok: true, pushed: 0 };
    if (rows.length === 0)
        return { ok: true, pushed: 0 };
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/sync_events`, {
            method: 'POST',
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                p_device_key: getDeviceKey(),
                p_app_id: appId,
                p_student_id: getStudent()?.studentId ?? null,
                p_events: rows,
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
 * 「まだ送っていない分を送り、送れたところまでを覚える」までを1つにしたもの。
 * マークは**成功したときだけ**進める。失敗したら次の機会に同じ分をもう一度送る。
 */
export async function flushEvents(config, logs) {
    const rows = toEventRows(logs, getSentMark(config.appId));
    if (rows.length === 0)
        return { ok: true, pushed: 0 };
    const r = await pushEvents(config, rows);
    if (r.ok)
        setSentMark(config.appId, rows[rows.length - 1].ts);
    return r;
}
//# sourceMappingURL=events.js.map