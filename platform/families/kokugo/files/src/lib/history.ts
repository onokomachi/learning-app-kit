/**
 * 時刻つきの学習の記録。
 *
 * このアプリは zustand を使っていないので、算数アプリの progressStore が
 * 持っている logs にあたるものが無かった。そのため学級ポータルには
 * 「いまどこまで到達しているか」しか送れず、いつ・どれだけ取り組んだかも、
 * できなかった問題も残っていなかった。
 *
 * ここで持つのは3つ。
 *   1. まちがえた回数（設問ごとに数える）
 *   2. できたときに1件（まちがえた回数つき）
 *   3. **できないまま別の設問へ移ったときにも1件**（とちゅうでやめた印つき）
 *
 * 記録は直近200件で打ち切る。1件あたり約120バイトなので、
 * 上限まで溜まっても25KB程度（ブラウザの上限5MBの0.5%）。
 */
import { UNIT } from '../unit';

const KEY = `${UNIT.appId}_history_v1`;
const LIMIT = 200;

export interface HistoryEntry {
  id: string;
  ts: number;
  skillId: string;
  moduleId: string;
  label: string;
  correct: boolean;
  mistakes: number;
  abandoned?: boolean;
}

function read(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(list: HistoryEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, LIMIT)));
  } catch {
    /* 容量超過などで保存できなくても学習は続けられる */
  }
}

export function getHistory(): HistoryEntry[] {
  return read();
}

/** 設問ごとの「まだ正解していないまちがい」の数。画面をまたいで持つ */
const pending = new Map<number, number>();

const push = (questionId: number, correct: boolean, mistakes: number, abandoned?: boolean) => {
  const entry: HistoryEntry = {
    id: `q${questionId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    skillId: `q-${questionId}`,
    moduleId: 'quiz',
    label: `設問${questionId}`,
    correct,
    mistakes,
    ...(abandoned ? { abandoned: true } : {}),
  };
  write([entry, ...read()]);
};

/** まちがえたときに呼ぶ。この時点ではまだ記録しない（正解するかもしれない） */
export function noteWrong(questionId: number): void {
  pending.set(questionId, (pending.get(questionId) ?? 0) + 1);
}

/** できたときに呼ぶ。まちがえた回数つきで1件残す */
export function noteCorrect(questionId: number): void {
  const m = pending.get(questionId) ?? 0;
  pending.delete(questionId);
  push(questionId, m === 0, m);
}

/**
 * まちがえたまま別の設問へ移った・画面を閉じたときに呼ぶ。
 * これが無いと「できなかった問題」ほど記録から消える。
 */
export function flushAbandoned(exceptQuestionId?: number): void {
  for (const [qid, m] of [...pending]) {
    if (qid === exceptQuestionId) continue;
    pending.delete(qid);
    push(qid, false, m, true);
  }
}
