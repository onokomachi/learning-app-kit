/**
 * 自分の記録をサーバから読む。子ども用ハブが「きょうの ふくしゅう」を
 * 単元をまたいで出すために使う。
 *
 * 単元アプリはこれを使わない。アプリ側の正本はあくまで端末の localStorage で、
 * サーバから引き戻すと「どちらが正しいか」の問題が生まれるため。
 * ハブは自分の記録を持っていないので、読む側に回る。
 */
import type { ResolveConfig } from './student.js';

export interface MySkillRow {
  app_id: string;
  skill_id: string;
  attempts: number;
  corrects: number;
  perfect_streak: number;
  box: number | null;
  next_due_ts: number | null;
  last_ts: number | null;
}

export type MyProgressResult =
  | { ok: true; rows: MySkillRow[] }
  | { ok: false; message: string };

/**
 * 自分の記録を取る。まだ名乗っていなければ空で返す（エラーにしない）。
 * サーバは渡された児童IDの行しか返さないので、他人の記録は取れない。
 */
export async function fetchMyProgress(
  config: ResolveConfig,
  studentId: string | null | undefined,
): Promise<MyProgressResult> {
  const { supabaseUrl, supabaseKey } = config;
  if (!supabaseUrl || !supabaseKey) return { ok: true, rows: [] };
  if (!studentId) return { ok: true, rows: [] };
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
    if (!res.ok) return { ok: false, message: `よみこめませんでした (${res.status})` };
    const rows = (await res.json()) as MySkillRow[];
    return { ok: true, rows: Array.isArray(rows) ? rows : [] };
  } catch {
    return { ok: false, message: 'ネットにつながっていないようです' };
  }
}

/** 復習の期限が来ているものを、期限超過が大きい順に返す。 */
export function dueFromRows(rows: readonly MySkillRow[], now = Date.now()): MySkillRow[] {
  return rows
    .filter((r) => r.next_due_ts != null && r.next_due_ts <= now)
    .sort((a, b) => (a.next_due_ts ?? 0) - (b.next_due_ts ?? 0));
}

/** my_activity が返す1行。「その日に何回やって、何回できたか」だけ。 */
export interface MyActivityRow {
  event_date: string;
  app_id: string;
  attempts: number;
  corrects: number;
}

export type MyActivityResult =
  | { ok: true; rows: MyActivityRow[] }
  | { ok: false; message: string };

/**
 * 自分がやった日を取る。子ども用ハブの「がんばった記録」に使う。
 *
 * 正答率は返さない。返すのは「何回やったか」と「何回できたか」だけで、
 * 割り算をした数字を子どもの画面に出さないため。
 */
export async function fetchMyActivity(
  config: ResolveConfig,
  studentId: string | null | undefined,
  days = 120,
): Promise<MyActivityResult> {
  const { supabaseUrl, supabaseKey } = config;
  if (!supabaseUrl || !supabaseKey) return { ok: true, rows: [] };
  if (!studentId) return { ok: true, rows: [] };
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/my_activity`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_student_id: studentId, p_days: days }),
    });
    if (!res.ok) return { ok: false, message: 'きろくが よみこめませんでした' };
    return { ok: true, rows: (await res.json()) as MyActivityRow[] };
  } catch {
    return { ok: false, message: 'ネットにつながっていないようです' };
  }
}

/**
 * 今日から何日連続で取り組んだか。
 *
 * 今日やっていなくても、昨日までの連続は途切れていない扱いにする
 * （夜に開いた子と朝に開いた子で見え方が変わらないように）。
 * 数える対象は「やった日」だけ。正解数は見ない——続けたこと自体を数える。
 */
export function streakDays(rows: readonly MyActivityRow[], today: string): number {
  const days = new Set(rows.map((r) => r.event_date));
  if (days.size === 0) return 0;
  const d = new Date(`${today}T00:00:00Z`);
  const iso = () => d.toISOString().slice(0, 10);
  // 今日が未着手なら、昨日から数え始める
  if (!days.has(iso())) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (days.has(iso())) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}
