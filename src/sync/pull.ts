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
