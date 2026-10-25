export type JoinChoice = 'named' | 'anonymous' | null;
/** まだ決めていなければ null。 */
export declare function getJoinChoice(): JoinChoice;
/**
 * コードを入れずに使う、と決める。
 * 記録は端末の中だけに残り、サーバへは匿名のまま届く（誰のものにもならない）。
 * あとから設定で名乗れば、それまでの分もその子のものになる。
 */
export declare function chooseAnonymous(): void;
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
/**
 * 名乗った子が「けす」「入れなおす」をするときに、先生のパスワードを確かめる（2026-10 先生と決めた）。
 *
 * すぐに変えられると、ほかの子になりすます・ぬけて戻る、のいたずらになる。子どもからの申告で
 * 先生がパスワードを入れて変える。パスワードはサーバにハッシュだけがあり、答え合わせもサーバでする
 * （プログラムの中に書くと、ブラウザで中を見られる）。学級ごとに PRISM で変えられる。10分に10回まちがえると待たされる。
 */
export declare function verifyUnlock(config: ResolveConfig, joinCode: string, code: string): Promise<{
    ok: true;
} | {
    ok: false;
    message: string;
}>;
/**
 * デモモード（学級コード 0000・番号 0。SANMON のアプリ紹介用）に入る前の、先生のパスワード（サーバの verify_demo）。
 * どれかの学級で先生が決めたパスワードと合えば通る。子どもだけでは入れないようにするため。
 */
export declare function verifyDemoCode(config: ResolveConfig, code: string): Promise<{
    ok: true;
} | {
    ok: false;
    message: string;
}>;
/** デモモードの合いことば（学級コード・番号） */
export declare const DEMO_JOIN: {
    readonly code: "0000";
    readonly number: 0;
};
export interface ClaimResult {
    ok: boolean;
    /** その端末から拾えた件数。名乗るのが初めてなら、これまでの全部が入る */
    events: number;
    tests: number;
    skills: number;
}
/**
 * この端末がそれまで匿名で送っていた記録を、名乗った子のものにする。
 *
 * 端末に残っているログは直近200件までなので、送り直しだけでは
 * それより前の記録を拾えない。サーバ側で device_key を手がかりに付け替える。
 *
 * **すでに誰かのものになっている行は動かさない**（サーバ側でそう書いてある）。
 * 同じ端末を別の子が使っても、前の子の記録を奪うことはない。
 *
 * 失敗しても学習は止めない。次に名乗り直したときにまた拾える。
 */
export declare function claimDevice(config: ResolveConfig, studentId?: string): Promise<ClaimResult>;
export {};
//# sourceMappingURL=student.d.ts.map