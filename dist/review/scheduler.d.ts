/**
 * 間隔反復（distributed / spaced practice）のスケジューラ。
 *
 * Dunlosky et al. (2013) が「高い有用性」と判定した2手法のうちの1つ、
 * 「間隔をあけて復習する」を単元アプリに組み込むための純粋関数群。
 * React や保存先には依存しない。状態は呼び出し側（Zustand の progressStore など）が持つ。
 *
 * 方式は Leitner 方式の簡易版:
 *   - 正解（ノーミス完答）するたびに box が 1 つ上がり、次の復習までの間隔が伸びる
 *   - ミスしたら box 0 に戻り、翌日にもう一度出る
 *   - 間隔の既定は 1 → 3 → 7 → 14 → 30 日
 */
export declare const DAY_MS = 86400000;
/** box ごとの「次の復習までの日数」。box は 0 始まりで、この配列の添字。 */
export declare const DEFAULT_INTERVALS_DAYS: readonly number[];
export interface ReviewState {
    /** 現在の箱（0 = いちばん短い間隔）。DEFAULT_INTERVALS_DAYS の添字 */
    box: number;
    /** 最後に取り組んだ時刻（ms） */
    lastTs: number;
    /** 次に復習する予定の時刻（ms） */
    nextDueTs: number;
}
export interface SchedulerOptions {
    intervalsDays?: readonly number[];
    now?: number;
}
/**
 * 1問（または1レベル）を解き終えたあとの状態を返す。
 * @param prev    そのスキルの直前の状態（初回は undefined）
 * @param correct ノーミスで完答できたか
 */
export declare function scheduleAfterResult(prev: ReviewState | undefined, correct: boolean, opts?: SchedulerOptions): ReviewState;
/** 復習の時期が来ているか */
export declare function isDue(state: ReviewState | undefined, now?: number): boolean;
/** 次の復習まであと何日か（負なら期限超過）。日数は切り上げ。 */
export declare function daysUntilDue(state: ReviewState, now?: number): number;
export interface DueSkill {
    skillId: string;
    box: number;
    /** 期限をどれだけ過ぎているか（日）。大きいほど優先 */
    overdueDays: number;
}
export interface GetDueOptions {
    now?: number;
    /** 返す最大件数（既定: 無制限） */
    limit?: number;
}
/**
 * 復習の時期が来ているスキルを、期限超過が大きい順に返す。
 * 「一度も解いていないスキル」は対象外（初回は通常の練習で触れる）。
 */
export declare function getDueSkills(states: Record<string, ReviewState | undefined>, opts?: GetDueOptions): DueSkill[];
export interface MasteryLike {
    attempts: number;
    corrects: number;
    perfectStreak?: number;
}
/**
 * スケジュールを持っていなかった既存データ（習熟度だけがある）から、初期状態を推定する。
 * localStorage の version 移行（migrate）で使う。
 *
 * 目安: 5連続ノーミス済み → box 2（7日後）／ 正答率70%以上 → box 1（3日後）／ それ以外 → box 0（翌日）
 */
export declare function inferInitialState(m: MasteryLike, lastTs: number, opts?: SchedulerOptions): ReviewState;
//# sourceMappingURL=scheduler.d.ts.map