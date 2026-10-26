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
 * - スタミナは各単元アプリの正解1問で1たまる（1つの項目で1日5まで・熟達した項目は半分・ためておけるのは100まで・ペアの時間は半分。
 *   2026-10-25〜 サーバの _sanmon_stamina が決める。dailyCap はもう使っていない）。
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
/**
 * 単元の「かけら」とレベルの上限の数え方（2026-10 先生と決めた）。
 *
 * モンスターのレベルの上限は、その単元のかけらでしか上がらない。かけらは単元アプリでの成果でもらう
 * （本番テストで8割の日・実力の階段で高い段まで）。アプリが無い単元は SANMON の練習（5回連続ノーミスの項目）でもらう。
 * 上限まで育てるには SANMON で そのモンスターの問題を解く。だから「アプリでがんばる」と「SANMON で練習する」の両方に理由ができる。
 * かけらで直接強くはしない（強さがふくらみすぎて、すぐにバランスが崩れるため）。
 */
export declare const SANMON_GROWTH: {
    /** かけらが0のときの上限 */
    readonly baseCap: 20;
    /** かけら1つで上がる上限 */
    readonly capPerShard: 5;
    readonly maxCap: 60;
    /** 本番テストで8割の日は、5日ぶんまで数える */
    readonly testShardsMax: 5;
    /** 実力の階段：この割合の段まで登るごとに1つ（半分・4分の3・てっぺん） */
    readonly trialMilestones: readonly number[];
    /** アプリが無い単元：SANMON の練習で、この数ぶんに分けてもらう */
    readonly practiceShardsMax: 8;
};
export interface SanmonShards {
    key: string;
    name: string;
    /** その単元のかけらの数 */
    shards: number;
    /** その単元のモンスターのレベルの上限 */
    cap: number;
    /** どこでもらったか（画面で「つぎは ここで もらえるよ」に使う） */
    from: {
        test: number;
        trial: number;
        practice: number;
    };
}
/** かけらの数 → レベルの上限 */
export declare function levelCapFor(shards: number): number;
/** 単元ごとの かけら と レベルの上限。サーバの記録（sanmon_status）から決めるので、端末を変えても同じ */
export declare function sanmonShards(status: SanmonStatus | null, catalogs?: Record<string, AppCatalog>): SanmonShards[];
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
    readonly desc: "つかまえたモンスターのパーティ（3匹か5匹）で、コンピュータと対戦";
}, {
    readonly key: "class_duel";
    readonly label: "クラス対戦";
    readonly desc: "同じ学級の友だちと、モンスターのパーティで対戦";
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
/**
 * 平日モード（2026-10-26 先生と決めた）。先生が PRISM で学級ごとにオンにすると、
 * 月〜金（祝日をのぞく）の start〜end は、modes のモード（ゲームの4つから えらぶ）が閉じる。
 * 判定はサーバの時計（日本時間。サーバの _sanmon_effective_modes）でする。iPad の時計を変えても抜けられない。
 * サーバは閉じたモードを false にして返すので、isModeOpen だけで効く（古いアプリでも効く）。
 */
export interface SanmonSchoolHours {
    enabled: boolean;
    /** いま閉じているか */
    active: boolean;
    /** 'HH:MM'（日本時間） */
    start: string;
    end: string;
    modes: SanmonModeKey[];
    /** 先生が「いまだけ開ける」を押したとき、その時刻まで開いている */
    open_until?: string | null;
    /** 先生の開け閉め（平日モードを入れる前）。通信が切れたときの判定に使う */
    base?: Partial<Record<SanmonModeKey, boolean>>;
}
/** 平日モードで閉じられるモード（ゲームだけ。練習・復習・本番テストは学習なので閉じない） */
export declare const SCHOOL_HOURS_MODES: readonly ["adventure", "speed", "monster", "class_duel"];
/** 平日モードの はじめの値 */
export declare const SCHOOL_HOURS_DEFAULT: {
    start: string;
    end: string;
    modes: SanmonModeKey[];
};
/** 書いていないモードは開いている（false のときだけ閉じる） */
export type SanmonModes = Partial<Record<SanmonModeKey, boolean>> & {
    _school_hours?: SanmonSchoolHours;
};
export declare function isModeOpen(modes: SanmonModes | null | undefined, key: SanmonModeKey): boolean;
/** そのモードが平日モード（授業の時間）で閉じているか */
export declare function isSchoolHoursLocked(modes: SanmonModes | null | undefined, key: SanmonModeKey): boolean;
/**
 * 閉じているモードを押したときに子どもに出す文。開いていれば null。
 * 授業の時間で閉じているときは「いつ開くか」と「いまできること」を出す（ただ閉じるより、こわれたと思われない）。
 */
export declare function modeLockMessage(modes: SanmonModes | null | undefined, key: SanmonModeKey): string | null;
/** 平日モードの時間か（端末の時計。通信が切れたときだけ使う。祝日は分からないので 月〜金 で見る） */
export declare function inSchoolHoursLocal(sh: Pick<SanmonSchoolHours, 'start' | 'end'>, now?: Date): boolean;
/** 通信が切れたとき：前に読めた平日モードの設定から、いまの開け閉めを作る */
export declare function offlineModes(cached: SanmonModes, now?: Date): SanmonModes;
/**
 * 自分の学級のモードの開け閉めを読む。
 * 読めたら端末に覚えておく。読めないときは、前に読めた設定で平日モードだけは効かせる（通信を切って抜けられないように）。
 * 一度も読めていなければ すべて開いている扱い（ok: false）。
 */
export declare function fetchSanmonModes(config: ResolveConfig, studentId: string): Promise<{
    ok: false;
    message: string;
} | {
    ok: true;
    modes: SanmonModes;
    offline?: undefined;
} | {
    ok: true;
    modes: SanmonModes;
    offline: true;
}>;
/**
 * 平日モードで閉じているモードを押したことをサーバに残す（先生の PRISM に「押した回数」として出る。ばつではなく声かけのため）。
 * サーバは、本当に平日モードで閉じているときだけ・同じモードは3分に1回だけ残す。失敗しても何もしない。
 */
export declare function reportLockHit(config: ResolveConfig, studentId: string, key: SanmonModeKey): Promise<void>;
//# sourceMappingURL=index.d.ts.map