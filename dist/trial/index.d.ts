export type TrialMode = '極限' | '無限';
/** 層の定義。skills はその層で出す問題の記号（アプリの generate に渡す） */
export interface TrialFloorDef {
    /** 画面に出す短い説明（例「何倍かを もとめる」） */
    label: string;
    skills: readonly string[];
}
export declare const QUESTIONS_PER_FLOOR = 2;
export declare const MISSES_TO_STOP = 2;
export declare const ENDLESS_MISSES = 3;
/** 刻印に必要な回数（通算） */
export declare const SEAL_COUNT = 3;
export interface ClimbStep {
    floor: number;
    skillId: string;
    correct: boolean;
}
export interface ClimbState {
    floors: number;
    /** 挑戦中の層（0始まり） */
    at: number;
    correct: number;
    misses: number;
    /** ノーミスで突破した層が、いま何層続いているか */
    perfectRun: number;
    /** 突破した段の数（0〜floors）。floors なら頂点 */
    cleared: number;
    skipped: number[];
    done: boolean;
    history: ClimbStep[];
}
export declare function startClimb(floors: number): ClimbState;
export declare function answerClimb(s: ClimbState, skillId: string, correct: boolean): ClimbState;
/** 次に出す問題の記号。同じ層で同じ記号が続かないようにする */
export declare function pickClimbSkill(s: ClimbState, defs: readonly TrialFloorDef[], rand?: () => number): string;
export interface EndlessState {
    score: number;
    misses: number;
    done: boolean;
    history: ClimbStep[];
}
export declare function startEndless(): EndlessState;
export declare function answerEndless(s: EndlessState, floor: number, skillId: string, correct: boolean): EndlessState;
/**
 * 無限の出題。進むほど上の層に寄せる（3問正解ごとに、出る層の下限が1つ上がる）。
 */
export declare function pickEndless(s: EndlessState, defs: readonly TrialFloorDef[], rand?: () => number): {
    floor: number;
    skillId: string;
};
export interface TrialRecord {
    eventId: string;
    ts: number;
    mode: TrialMode;
    /** 突破した層の数（無限では floors） */
    floor: number;
    floors: number;
    /** 無限で正解した数 */
    score: number;
    /** ソロで最後までやった回か。刻印に数えるのはこの回だけ */
    soloComplete: boolean;
    /** サーバに送れたか（端末の記録だけに使う） */
    sent?: boolean;
}
export interface TrialSummary {
    /** いちばん新しい極限の結果。まだ一度もなければ null */
    current: number | null;
    /** 極限で届いたいちばん高い層 */
    best: number;
    /** 刻印のある、いちばん高い層（0なら刻印なし） */
    sealed: number;
    /** 次に刻印を目指す層と、そこへ届いた回数（ソロで最後まで） */
    nextSeal: {
        floor: number;
        count: number;
    } | null;
    endlessUnlocked: boolean;
    endlessBest: number;
    runs: number;
}
export declare function summarize(records: readonly TrialRecord[], floors: number): TrialSummary;
/** 本番テストの設問1つ。floor 層を突破していれば取れる、とみなす */
export interface TestItemReq {
    points: number;
    floor: number;
}
export declare function predictScore(items: readonly TestItemReq[], cleared: number): number;
/** いまより上で、点が上がる最初の層と、上がる点数 */
export declare function nextGain(items: readonly TestItemReq[], cleared: number, floors: number): {
    floor: number;
    gain: number;
} | null;
export declare function loadTrials(appId: string): TrialRecord[];
/** サーバの記録を足し合わせる（端末のデータが消えたときの復元）。同じ回は1つにまとめる */
export declare function mergeTrials(local: readonly TrialRecord[], remote: readonly TrialRecord[]): TrialRecord[];
export interface TrialSyncConfig {
    appId: string;
    supabaseUrl?: string;
    supabaseKey?: string;
}
/** まだ送っていない記録をサーバへ送る。失敗しても何も壊さない（次の機会に送る） */
export declare function flushTrials(config: TrialSyncConfig): Promise<number>;
/** 1回分を保存して、送れるなら送る */
export declare function saveTrial(config: TrialSyncConfig, rec: Omit<TrialRecord, 'eventId' | 'ts' | 'sent'> & {
    ts?: number;
}): Promise<TrialRecord>;
/**
 * サーバから自分の記録を取り戻して、端末の記録と合わせる。
 * 学級コードを入れていない子（studentId が無い）は端末の記録だけを返す。
 */
export declare function syncTrialsFromServer(config: TrialSyncConfig): Promise<TrialRecord[]>;
/** 以前の見出し（第Ⅰ層…）。いまの画面は算用数字の「第3段」を使う（小4でも読める） */
export declare const NUMERALS: readonly ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ"];
/** 画面に出す名前 */
export declare const TRIAL_NAME = "\u5B9F\u529B\u306E\u968E\u6BB5";
export declare const TRIAL_SUBTITLE = "STEP TO \u7B97\u6570MASTER";
/** 刻印（ソロで最後まで・通算3回）の画面での呼び名 */
export declare const SAVE_NAME = "\u30BB\u30FC\u30D6";
/** 突破した段の数 → 子どもの画面の名前。0 は「第1段に挑戦中」、全段なら頂点 */
export declare function floorName(cleared: number, floors: number): string;
/**
 * 無限で出す段。本番テストに出ない項目（extra）も、同じモジュール（記号の前半）の段に混ぜる。
 * 同じモジュールの段が無い項目は、最後に「そのほかの項目」の段としてまとめる。
 *
 * 極限はテストの範囲のまま（テスト予想を正直に保つ）。頂点に届いた子は、無限で
 * 単元のすべての項目に挑める。
 */
export declare function withExtraSkills(floors: readonly TrialFloorDef[], extra: readonly string[]): TrialFloorDef[];
/** 本番テストの設問の形（各アプリの TEST_STEPS がこの形を持っている） */
export interface TestStepLike {
    skillId: string;
    points: number;
    title: string;
    section?: string;
}
export interface TrialPlan {
    floors: TrialFloorDef[];
    /** 本番テストの各設問が、何層まで突破していれば取れるか */
    reqs: TestItemReq[];
    /** 予想点の満点（点のある設問の合計） */
    max: number;
}
/**
 * アプリの本番テストの設問から、実力の階段の段を組む。
 *
 * **層の順は本番テストの設問の順**（表の大問1 → … → 裏）。本番テストは
 * 基本から応用へ並んでいるので、そのまま「やさしい層から」になる。
 * 同じモジュール（記号の前半）が続く項目は1つの層にまとめ（3つまで）、
 * それでも maxFloors を超えるときは、項目の少ない となり同士を まとめる。
 *
 * これは**仮の組み方**。実際の紙のテストに合わせて並べ直すときは、
 * アプリ側で floors と reqs を手で書けばよい（倍の見方がその形）。
 */
export declare function floorsFromTestSteps(steps: readonly TestStepLike[], opts?: {
    maxFloors?: number;
    minFloors?: number;
}): TrialPlan;
//# sourceMappingURL=index.d.ts.map