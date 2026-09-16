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
export declare function totalsBetween(rows: readonly MyActivityRow[], from: string, to: string): ActivityTotals;
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