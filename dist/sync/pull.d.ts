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
export type MyProgressResult = {
    ok: true;
    rows: MySkillRow[];
} | {
    ok: false;
    message: string;
};
/**
 * 自分の記録を取る。まだ名乗っていなければ空で返す（エラーにしない）。
 * サーバは渡された児童IDの行しか返さないので、他人の記録は取れない。
 */
export declare function fetchMyProgress(config: ResolveConfig, studentId: string | null | undefined): Promise<MyProgressResult>;
/** 復習の期限が来ているものを、期限超過が大きい順に返す。 */
export declare function dueFromRows(rows: readonly MySkillRow[], now?: number): MySkillRow[];
//# sourceMappingURL=pull.d.ts.map