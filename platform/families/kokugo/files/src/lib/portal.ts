/**
 * 学級ポータルへの学習記録の送信。
 *
 * このアプリは zustand を使っていない（素の useState と localStorage）ので、
 * learning-app-kit/sync の createSyncedStorage は使えない。
 * 代わりに createPusher で明示的に送る。
 *
 * 送るのは「どの設問を何回やって何回正解したか」だけ。
 * 本文・解答・氏名は一切送らない。端末の匿名IDしか付かない。
 */
import { createPusher, pushEvents, pairChecker, type PushRow, type EventRow } from 'learning-app-kit/sync';
import { UNIT } from '../unit';

export const APP_ID = UNIT.appId;

/**
 * 環境変数を安全に読む。
 * Vite の外（テストや素のNodeでの読み込み）では import.meta.env 自体が存在せず、
 * そのまま参照するとモジュールを読んだ瞬間に例外になる。
 */
function env(key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY'): string | undefined {
  return (import.meta as { env?: Record<string, string | undefined> }).env?.[key];
}

const push = createPusher({
  appId: APP_ID,
  supabaseUrl: env('VITE_SUPABASE_URL'),
  supabaseKey: env('VITE_SUPABASE_PUBLISHABLE_KEY'),
});

interface WrongEntryLike {
  questionId: number;
  wrongCount: number;
}

/**
 * アプリの状態を、ポータルが受け取る形に直す。
 *
 * clearCount は「周回で正解した回数」、wrongLog は「まちがえた回数」なので、
 * 試行回数は両者の和になる。片方しか無い設問（正解だけ／誤答だけ）も拾う。
 */
export function toRows(
  clearCount: Record<number, number>,
  wrongLog: readonly WrongEntryLike[],
): PushRow[] {
  const wrong = new Map<number, number>();
  for (const w of wrongLog) wrong.set(w.questionId, w.wrongCount);

  const ids = new Set<number>([
    ...Object.keys(clearCount).map(Number),
    ...wrong.keys(),
  ]);

  const rows: PushRow[] = [];
  for (const id of ids) {
    if (!Number.isFinite(id)) continue;
    const corrects = clearCount[id] ?? 0;
    const attempts = corrects + (wrong.get(id) ?? 0);
    if (attempts === 0) continue;
    rows.push({ skill_id: `q-${id}`, attempts, corrects });
  }
  return rows.sort((a, b) => a.skill_id.localeCompare(b.skill_id));
}

/** 時刻つきの記録1件ぶん（src/lib/history.ts と同じ形） */
interface HistoryLike {
  id: string;
  ts: number;
  skillId: string;
  moduleId: string;
  label: string;
  correct: boolean;
  mistakes: number;
  abandoned?: boolean;
}

/** どこまで送ったか。成功したときだけ進める（失敗したら次に送り直す） */
const MARK = `${APP_ID}_sent_ts_v1`;
const getMark = (): number => {
  try { const v = Number(localStorage.getItem(MARK)); return Number.isFinite(v) && v > 0 ? v : 0; }
  catch { return 0; }
};
const setMark = (ts: number) => { try { localStorage.setItem(MARK, String(ts)); } catch { /* noop */ } };

const config = {
  appId: APP_ID,
  supabaseUrl: env('VITE_SUPABASE_URL'),
  supabaseKey: env('VITE_SUPABASE_PUBLISHABLE_KEY'),
};

/**
 * 状態が変わるたびに呼んでよい。まとめて数秒後に1回だけ送られる。
 *
 * 到達状況（どの設問を何回できたか）と、時刻つきの記録（いつ・何回まちがえたか）は
 * 別々に送る。片方が失敗しても、もう片方は届く。
 */
export function syncToPortal(
  clearCount: Record<number, number>,
  wrongLog: readonly WrongEntryLike[],
  history: readonly HistoryLike[] = [],
): void {
  push(toRows(clearCount, wrongLog));

  const since = getMark();
  // 1台を2人で使っていた時間（kit が「ひとり？ふたり？」で聞いた区間）の記録には印を付ける。
  // PRISM は印のある記録を、取り組んだ量には数え、正答率・学力の集計からは外す。
  // kit の toEventRows と同じ扱い。これが無いと、ふたりで解いた分も持ち主の子の実力に数えられる
  const isPair = pairChecker();
  const rows: EventRow[] = history
    .filter((h) => h.ts > since)
    .sort((a, b) => a.ts - b.ts)
    .slice(0, 500)
    .map((h) => ({
      event_id: h.id, skill_id: h.skillId, module_id: h.moduleId, label: h.label,
      correct: h.correct, mistakes: h.mistakes, abandoned: !!h.abandoned, ts: h.ts,
      ...(isPair(h.ts) ? { pair: true as const } : {}),
    }));
  if (rows.length === 0) return;
  void pushEvents(config, rows).then((r) => { if (r.ok) setMark(rows[rows.length - 1]!.ts); });
}
