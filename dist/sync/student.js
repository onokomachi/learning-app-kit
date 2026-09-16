/**
 * 児童の識別（学級コード＋出席番号）。
 *
 * サーバに氏名は無い。児童は「この学級の12番」としか名乗らず、
 * 番号と氏名の対応表は先生の手元に残る。だからこの仕組みが丸ごと漏れても
 * 誰のことかは分からない。
 *
 * Googleログインを採らなかったのは、自治体アカウントのOAuth設定が
 * 学校の管理下にあり、担任の権限では作れない可能性があるため。
 * なりすまし（他人の番号を入れる）は防げないので、評価の根拠に使うときは
 * 先生が名簿と突き合わせること。
 */
const KEY = 'lak_student_v1';
/** 覚えている児童情報。まだ入力していなければ null。 */
export function getStudent() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw)
            return null;
        const v = JSON.parse(raw);
        if (typeof v.studentId !== 'string' || typeof v.number !== 'number')
            return null;
        return { studentId: v.studentId, joinCode: String(v.joinCode ?? ''), number: v.number };
    }
    catch {
        return null;
    }
}
export function clearStudent() {
    try {
        localStorage.removeItem(KEY);
    }
    catch { /* 消せなくても動く */ }
}
/**
 * 学級コードと出席番号から児童IDを受け取り、端末に覚えさせる。
 *
 * サーバは名簿に無い番号を拒否する（打ちまちがいで幽霊児童を作らないため）。
 * エラーはそのまま子どもに見せられる日本語で返す。
 */
export async function resolveStudent(config, joinCode, number) {
    const { supabaseUrl, supabaseKey } = config;
    if (!supabaseUrl || !supabaseKey)
        return { ok: false, message: '接続先が設定されていません' };
    const code = joinCode.trim();
    if (!code)
        return { ok: false, message: 'がっきゅうコードを入れてください' };
    if (!Number.isInteger(number) || number < 1)
        return { ok: false, message: 'しゅっせき番号を入れてください' };
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/resolve_student`, {
            method: 'POST',
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ p_join_code: code, p_number: number }),
        });
        if (!res.ok) {
            let message = 'うまくいきませんでした。もう一度ためしてください';
            try {
                const body = (await res.json());
                if (body?.message)
                    message = body.message;
            }
            catch { /* 本文が読めなくても既定の文言で返す */ }
            return { ok: false, message };
        }
        const studentId = String(await res.json());
        const student = { studentId, joinCode: code, number };
        try {
            localStorage.setItem(KEY, JSON.stringify(student));
        }
        catch { /* 覚えられなくても今回は使える */ }
        return { ok: true, student };
    }
    catch {
        return { ok: false, message: 'ネットにつながっていないようです' };
    }
}
//# sourceMappingURL=student.js.map