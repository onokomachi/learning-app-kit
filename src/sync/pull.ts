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

/**
 * my_activity が返す1行。
 *
 * 正答率そのものは返ってこない。返るのは回数までで、割り算は画面側でやる。
 * 「先週の自分」と比べるのに要るものだけを渡し、
 * 他人と比べられる数（順位・学級平均）はここから出せないようにしてある。
 */
export interface MyActivityRow {
  event_date: string;
  app_id: string;
  /** その日に取り組んだ問題の数 */
  attempts: number;
  /** そのうち一発でできた数 */
  corrects: number;
  /** まちがえた回数（1つの問題で何度もまちがえれば、その数だけ増える） */
  mistakes?: number;
  /** 正解までたどりつかずに離れた数 */
  abandoned?: number;
}

/** 期間内の合計。正答率はここで初めて割り算する。 */
export interface ActivityTotals {
  attempts: number;
  corrects: number;
  mistakes: number;
  /** のべ解答数 = 取り組んだ回数 + まちがえた回数 */
  answers: number;
  /** 問題単位の正答率。のべ解答数が0なら null（0%と表示しないため） */
  rate: number | null;
}

/** 日付の範囲を決めて合計する。from/to は 'YYYY-MM-DD'（両端を含む）。 */
export function totalsBetween(
  rows: readonly MyActivityRow[],
  from: string,
  to: string,
): ActivityTotals {
  let attempts = 0, corrects = 0, mistakes = 0;
  for (const r of rows) {
    if (r.event_date < from || r.event_date > to) continue;
    attempts += Number(r.attempts) || 0;
    corrects += Number(r.corrects) || 0;
    mistakes += Number(r.mistakes ?? 0) || 0;
  }
  const answers = attempts + mistakes;
  return { attempts, corrects, mistakes, answers, rate: answers > 0 ? corrects / answers : null };
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

/** my_skill_totals が返す1行。項目（スキル）ごとの、のべ解答数と正解数。 */
export interface MySkillTotalRow {
  app_id: string;
  skill_id: string;
  /** のべ解答数 = 取り組んだ回数 + まちがえた回数 */
  answers: number;
  corrects: number;
  mistakes: number;
  abandoned: number;
  last_ts: number | null;
}

export type MySkillTotalsResult =
  | { ok: true; rows: MySkillTotalRow[] }
  | { ok: false; message: string };

/**
 * 項目ごとのできぐあいを取る。
 *
 * my_skill_state（到達状況）とは別物。あちらはラウンド単位の累計で、
 * 「何回まちがえたか」を含まないので項目ごとの正答率が出せない。
 */
export async function fetchMySkillTotals(
  config: ResolveConfig,
  studentId: string | null | undefined,
): Promise<MySkillTotalsResult> {
  const { supabaseUrl, supabaseKey } = config;
  if (!supabaseUrl || !supabaseKey) return { ok: true, rows: [] };
  if (!studentId) return { ok: true, rows: [] };
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/my_skill_totals`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_student_id: studentId }),
    });
    if (!res.ok) return { ok: false, message: 'きろくが よみこめませんでした' };
    return { ok: true, rows: (await res.json()) as MySkillTotalRow[] };
  } catch {
    return { ok: false, message: 'ネットにつながっていないようです' };
  }
}

/** 1週間ぶんの成績。グラフの1点になる。 */
export interface WeekPoint {
  /** その週の始まり（'YYYY-MM-DD'）。月曜はじまり */
  start: string;
  /** その週の終わり（'YYYY-MM-DD'） */
  end: string;
  answers: number;
  corrects: number;
  /** 問題単位の正答率。のべ解答数が足りなければ null（点を打たない） */
  rate: number | null;
}

/** その日を含む週の月曜日（'YYYY-MM-DD'）。日曜は前の週に入れる。 */
export function weekStart(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = d.getUTCDay();               // 0=日曜
  d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * 週ごとの推移。直近 weeks 週ぶんを古い順に返す。
 *
 * 記録が少ない週は rate を null にする。点が打たれないので、
 * 「1問だけやって落ちた週」がグラフ上で急落に見えることがない。
 */
export function weeklyTrend(
  rows: readonly MyActivityRow[],
  weeks = 8,
  today: string = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10),
  minAnswers = 10,
): WeekPoint[] {
  const thisMonday = weekStart(today);
  const starts: string[] = [];
  const d = new Date(`${thisMonday}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 7 * (weeks - 1));
  for (let i = 0; i < weeks; i++) {
    starts.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 7);
  }

  const byWeek = new Map<string, { answers: number; corrects: number }>();
  for (const r of rows) {
    const k = weekStart(r.event_date);
    const cur = byWeek.get(k) ?? { answers: 0, corrects: 0 };
    cur.answers += (Number(r.attempts) || 0) + (Number(r.mistakes ?? 0) || 0);
    cur.corrects += Number(r.corrects) || 0;
    byWeek.set(k, cur);
  }

  return starts.map((start) => {
    const e = new Date(`${start}T00:00:00Z`);
    e.setUTCDate(e.getUTCDate() + 6);
    const v = byWeek.get(start) ?? { answers: 0, corrects: 0 };
    return {
      start,
      end: e.toISOString().slice(0, 10),
      answers: v.answers,
      corrects: v.corrects,
      rate: v.answers >= minAnswers ? v.corrects / v.answers : null,
    };
  });
}
