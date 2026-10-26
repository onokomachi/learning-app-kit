/**
 * 学級ごとの単元の開け閉め（2026-10-26 先生と決めた）。
 *
 * 先生が PRISM の SOL タブで、学級ごとに「どの単元アプリを開くか」を決める（サーバの class_app_access）。
 * - SOL（子ども用ハブ）は fetchClosedApps で閉じた単元を読み、🔒 で出す。
 * - 単元アプリは JoinGate の中の AppAccessGate が checkAppOpen で確かめ、閉じていれば画面を止める
 *   （子どもは SOL を通らず、ブックマークなどで直接開くため）。
 * 止めるのは学級コードで名乗った子だけ。名乗っていない子・ほかの学級の子は今までどおり使える。
 * 読めないとき（ネットが切れている など）は開いている扱い（学習を止めない）。
 */
import type { ResolveConfig } from './student.js';

/** 子ども用ハブ（SOL）。閉じた単元アプリの「SOL に もどる」に使う */
export const SOL_URL = 'https://class-portal-kids.vercel.app';

async function rpc<T>(config: ResolveConfig, fn: string, body: unknown): Promise<T | null> {
  const { supabaseUrl, supabaseKey } = config;
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** 自分の学級で閉じている単元の app_id。読めなければ null（＝開いている扱い） */
export async function fetchClosedApps(config: ResolveConfig, studentId: string): Promise<Set<string> | null> {
  const r = await rpc<string[]>(config, 'my_closed_apps', { p_student_id: studentId });
  return r ? new Set(r) : null;
}

/** このアプリ（location.origin）が、その子の学級で開いているか。分からなければ true */
export async function checkAppOpen(config: ResolveConfig, studentId: string, origin: string): Promise<boolean> {
  const r = await rpc<boolean>(config, 'app_open_for', { p_student_id: studentId, p_origin: origin });
  return r !== false;
}
