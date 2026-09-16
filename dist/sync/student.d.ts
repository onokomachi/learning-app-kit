export interface StudentIdentity {
    /** サーバが発行したID。氏名は含まれない */
    studentId: string;
    /** 入力した学級コード。次に聞かないで済ませるために覚えておく */
    joinCode: string;
    /** 出席番号。画面に「12番さん」と出すためだけに使う */
    number: number;
}
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
//# sourceMappingURL=student.d.ts.map