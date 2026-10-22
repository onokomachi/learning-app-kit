/**
 * SANMON:04（小4算数のゲーム）と学級ポータルをつなぐ「きまり」。
 *
 * 子ども用ハブ（町の解放メーターとスタミナを見せる）と SANMON（町に入れるか・バトルでスタミナを使う）が
 * 同じきまりで判定するよう、ここ1か所に置く。どちらかだけ直すと、ハブでは「開いた」のに SANMON では入れない、が起きる。
 *
 * きまり（2026-10 先生と決めたこと）:
 * - 町（単元）を開けるには、その単元アプリで 4つ を **すべて** 満たす。誰かに1回だけクリアしてもらう、運でクリア、を防ぐため。
 *     練習  … 練習の項目の7割を「できた」（5回連続ノーミス）にする
 *     テスト … 本番テストで8割以上を取った日が、**ちがう日に3日**（ペアの時間は数えない）。
 *              「ぜんぶ」で8割、または同じ日に「表」と「裏」の両方で8割なら、その日を1日と数える（数えるのはサーバの sanmon_status）。
 *              同じ日に何回合格しても1日。
 *     階段  … 実力の階段を、ひとりで 半分の段 まで登る
 *     ねばり … その単元を ひとりで **3日以上** 練習する
 * - アプリが無い単元（大きい数・折れ線グラフと表・角の大きさ）は はじめから開いている。
 * - スタミナは各単元アプリの正解1問で1たまる（1日30まで・ためておけるのは100まで・ペアの時間は半分）。
 *   SANMON のバトル1回で5使う。SANMON の練習・復習・本番テストはスタミナなしで使える。
 *   計算はサーバ（sanmon_status / sanmon_spend）がする。端末の数字を書きかえても増えない。
 */
import { type AppCatalog } from '../catalog/index.js';
import type { ResolveConfig } from '../sync/student.js';
export declare const SANMON_APP_ID = "sanmon";
export declare const SANMON_RULES: {
    readonly practiceRatio: 0.7;
    readonly testRatio: 0.8;
    readonly testPassDays: 3;
    readonly trialRatio: 0.5;
    readonly soloDays: 3;
    readonly battleCost: 5;
    readonly dailyCap: 30;
    readonly maxStamina: 100;
};
export interface SanmonUnitRule {
    /** SANMON の UNIT_KEYS と同じ記号 */
    key: string;
    /** SANMON の単元名（MATH_CATEGORIES の name） */
    name: string;
    /** その単元の学級ポータルのアプリ。無ければ はじめから開いている */
    appId?: string;
    /** 練習の数に入れるカタログのモジュール（省略＝アプリのすべて） */
    modules?: string[];
    /** 本番テストの記録の skill_id（省略＝'mock-test'） */
    testSkill?: string;
}
/** SANMON の町（はじめ14、2026-10 に 垂直・平行と四角形 を足して15）。並びは SANMON の学習順（MATH_CATEGORIES）と同じ */
export declare const SANMON_UNITS: SanmonUnitRule[];
/** サーバ（sanmon_status）が返す、アプリごとの記録 */
export interface SanmonAppRecord {
    mastered: string[];
    /** テストの skill_id → 8割以上を取った日数（ぜんぶで8割、または同じ日に表と裏の両方で8割の日） */
    tests: Record<string, number>;
    /** ひとりで登った いちばん高い段の割合（0〜1） */
    trial: number;
    solo_days: number;
}
export interface SanmonStatus {
    stamina: number;
    earnedToday: number;
    apps: Record<string, SanmonAppRecord>;
}
export interface Meter {
    have: number;
    need: number;
    done: boolean;
}
export interface SanmonUnitProgress {
    key: string;
    name: string;
    appId?: string;
    appTitle?: string;
    appUrl?: string;
    /** アプリが無いので はじめから開いている */
    always: boolean;
    open: boolean;
    practice?: Meter;
    test?: Meter;
    /** 段の数で表す（例: 8段の階段なら need=4） */
    trial?: Meter;
    days?: Meter;
}
/** 町ごとの「あと どれだけ」。判定はこの関数だけでする */
export declare function sanmonUnits(status: SanmonStatus | null, catalogs?: Record<string, AppCatalog>): SanmonUnitProgress[];
/** 開いている町の記号（SANMON の UNIT_KEYS）の集合 */
export declare function openUnitKeys(units: readonly SanmonUnitProgress[]): Set<string>;
/** スタミナと、町を開ける判定に使う記録を読む */
export declare function fetchSanmonStatus(config: ResolveConfig, studentId: string): Promise<{
    ok: false;
    message: string;
} | {
    ok: true;
    status: {
        stamina: number;
        earnedToday: number;
        apps: Record<string, SanmonAppRecord>;
    };
}>;
/**
 * スタミナを使う。足りなければ ok=false（使わない）。
 * eventId はバトルごとに1つ。同じ eventId で送り直しても二重に減らない。
 */
export declare function spendStamina(config: ResolveConfig, studentId: string, eventId: string, amount?: number, reason?: string): Promise<{
    ok: false;
    stamina: null;
    message: string;
} | {
    ok: true;
    stamina: number;
    message?: undefined;
} | {
    ok: false;
    stamina: number;
    message: string;
}>;
/** SANMON のセーブデータ（端末をまたいで続きから遊ぶ） */
export declare function loadSanmonSave(config: ResolveConfig, studentId: string): Promise<{
    ok: false;
    message: string;
} | {
    ok: true;
    data: Record<string, unknown> | null;
}>;
export declare function saveSanmonSave(config: ResolveConfig, studentId: string, data: Record<string, unknown>): Promise<boolean>;
/**
 * 先生が開け閉めできる SANMON のモード。サーバの表 sanmon_mode_settings の modes のキー。
 * 「きろく」は いつも開いている（自分の記録を見るだけなので）。
 */
export declare const SANMON_MODES: readonly [{
    readonly key: "adventure";
    readonly label: "ぼうけん";
    readonly desc: "3Dの町を歩いて、モンスターと算数バトル";
}, {
    readonly key: "speed";
    readonly label: "スピードデュエル";
    readonly desc: "コンピュータと早押し";
}, {
    readonly key: "monster";
    readonly label: "モンスター対戦（コンピュータ）";
    readonly desc: "つかまえたモンスターで、コンピュータと早押し";
}, {
    readonly key: "class_duel";
    readonly label: "クラス対戦";
    readonly desc: "同じ学級の友だちと、モンスターの問題で早押し";
}, {
    readonly key: "practice";
    readonly label: "練習";
    readonly desc: "分野をえらんで問題をとく";
}, {
    readonly key: "review";
    readonly label: "復習";
    readonly desc: "まちがえた問題を ちょうどよいころに";
}, {
    readonly key: "mock_test";
    readonly label: "本番テスト";
    readonly desc: "学校のテストの形で";
}];
export type SanmonModeKey = (typeof SANMON_MODES)[number]['key'];
/** 書いていないモードは開いている（false のときだけ閉じる） */
export type SanmonModes = Partial<Record<SanmonModeKey, boolean>>;
export declare function isModeOpen(modes: SanmonModes | null | undefined, key: SanmonModeKey): boolean;
/** 自分の学級のモードの開け閉めを読む（読めないときは すべて開いている扱い） */
export declare function fetchSanmonModes(config: ResolveConfig, studentId: string): Promise<{
    ok: false;
    message: string;
} | {
    ok: true;
    modes: Partial<Record<"adventure" | "speed" | "monster" | "class_duel" | "practice" | "review" | "mock_test", boolean>>;
}>;
//# sourceMappingURL=index.d.ts.map