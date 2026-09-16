export interface StudentIdentity {
    /** サーバが発行したID。氏名は含まれない */
    studentId: string;
    /** 入力した学級コード。次に聞かないで済ませるために覚えておく */
    joinCode: string;
    /** 出席番号。画面に「12番さん」と出すためだけに使う */
    number: number;
}
type StudentListener = (s: StudentIdentity | null) => void;
/**
 * 名乗りが決まった（または消えた）ときに呼ばれる。
 *
 * これが要るのは、ハブから来た子の「今まで端末に溜まっていた記録」を
 * 取りこぼさないため。起動直後の送信はすぐ走るのに対し、名乗りの解決は
 * ネット越しなので必ずそれより遅く終わる。購読していないと、その1回の送信は
 * student_id が null のまま届き、その子が次に1問解くまで誰のものか付かない。
 */
export declare function subscribeStudent(cb: StudentListener): () => void;
/** 覚えている児童情報。まだ入力していなければ null。 */
export declare function getStudent(): StudentIdentity | null;
export declare function clearStudent(): void;
export interface ResolveConfig {
    supabaseUrl?: string;
    supabaseKey?: string;
}
export type ResolveResult = {
    ok: true;
    student: StudentIdentity;
} | {
    ok: false;
    message: string;
};
/**
 * 学級コードと出席番号から児童IDを受け取り、端末に覚えさせる。
 *
 * サーバは名簿に無い番号を拒否する（打ちまちがいで幽霊児童を作らないため）。
 * エラーはそのまま子どもに見せられる日本語で返す。
 */
export declare function resolveStudent(config: ResolveConfig, joinCode: string, number: number): Promise<ResolveResult>;
export {};
//# sourceMappingURL=student.d.ts.map