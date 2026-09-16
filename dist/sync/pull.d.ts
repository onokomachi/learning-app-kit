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
/** my_activity が返す1行。「その日に何回やって、何回できたか」だけ。 */
export interface MyActivityRow {
    event_date: string;
    app_id: string;
    attempts: number;
    corrects: number;
}
export type MyActivityResult = {
    ok: true;
    rows: MyActivityRow[];
} | {
    ok: false;
    message: string;
};
/**
 * 自分がやった日を取る。子ども用ハブの「がんばった記録」に使う。
 *
 * 正答率は返さない。返すのは「何回やったか」と「何回できたか」だけで、
 * 割り算をした数字を子どもの画面に出さないため。
 */
export declare function fetchMyActivity(config: ResolveConfig, studentId: string | null | undefined, days?: number): Promise<MyActivityResult>;
/**
 * 今日から何日連続で取り組んだか。
 *
 * 今日やっていなくても、昨日までの連続は途切れていない扱いにする
 * （夜に開いた子と朝に開いた子で見え方が変わらないように）。
 * 数える対象は「やった日」だけ。正解数は見ない——続けたこと自体を数える。
 */
export declare function streakDays(rows: readonly MyActivityRow[], today: string): number;
//# sourceMappingURL=pull.d.ts.map