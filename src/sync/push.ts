/**
 * zustand を使っていないアプリ向けの、明示的な送信口。
 *
 * createSyncedStorage は zustand の persist に差し込む前提なので、
 * 素の useState と localStorage で書かれたアプリ（国語の読解アプリなど）では使えない。
 * そういうアプリは、自分の状態を rows に変換してこの関数を呼ぶ。
 *
 * 送信に失敗しても投げない。学習を止めないことを、届くことより優先する。
 */
import type { SyncConfig } from './types.js';
import { getDeviceKey } from './device.js';
import { getStudent } from './student.js';

/** 送信する1スキルぶん。skill_id はカタログと同じ文字列にする。 */
export interface PushRow {
  skill_id: string;
  attempts: number;
  corrects: number;
  perfect_streak?: number;
  box?: number | null;
  next_due_ts?: number | null;
  last_ts?: number | null;
}

export interface PushResult {
  ok: boolean;
  /** サーバが実際に受理した件数。巻き戻し防止で弾かれた行は含まれない */
  pushed: number;
  error?: string;
}

export type PushConfig = Pick<SyncConfig, 'appId' | 'supabaseUrl' | 'supabaseKey'>;

/**
 * 学習記録を学級ポータルへ送る。
 * supabaseUrl / supabaseKey が無ければ何もしない（設定し忘れても壊れない）。
 */
export async function pushSkillState(config: PushConfig, rows: PushRow[]): Promise<PushResult> {
  const { appId, supabaseUrl, supabaseKey } = config;
  if (!supabaseUrl || !supabaseKey) return { ok: true, pushed: 0 };
  if (rows.length === 0) return { ok: true, pushed: 0 };

  // 壊れた行はここで落とす。1件の不正で全体を失敗させない
  const valid = rows.filter(
    (r) => r.skill_id && r.attempts >= 0 && r.corrects >= 0 && r.corrects <= r.attempts,
  );
  if (valid.length === 0) return { ok: true, pushed: 0 };

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
    if (!res.ok) return { ok: false, pushed: 0, error: `HTTP ${res.status}` };
    return { ok: true, pushed: Number(await res.text()) };
  } catch (e) {
    return { ok: false, pushed: 0, error: (e as Error).message };
  }
}

/**
 * 送信をまとめる。何度呼んでも、最後の呼び出しから wait ミリ秒たってから1回だけ送る。
 * 画面の操作ごとに呼んでよい形にするためのもの。
 */
export function createPusher(config: PushConfig, wait = 3000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest: PushRow[] = [];
  return (rows: PushRow[], onDone?: (r: PushResult) => void) => {
    latest = rows;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { void pushSkillState(config, latest).then((r) => onDone?.(r)); }, wait);
  };
}
