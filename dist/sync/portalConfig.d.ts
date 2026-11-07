/**
 * 学級ポータル全体の設定を、単元アプリが読む（2026-11-07）。
 *
 * - requireJoin：普通のリンクでは 学級コード＋番号を必須にする（PRISM の管理タブのスイッチ。はじめは切）
 * - trialListed / trialFeatures：体験版で このアプリを出すか、どの項目を使えるか（PRISM の管理タブ）
 *
 * サーバの portal_app_config（apps.url の origin と location.origin で、どのアプリかを見分ける）。
 * 読めたら端末に覚えておき、通信が切れたときは前に読めた値を使う。一度も読めていなければ、何も止めない（学習を止めない）。
 */
import type { ResolveConfig } from './student.js';
export interface PortalAppConfig {
    requireJoin: boolean;
    appId: string | null;
    trialListed: boolean;
    /** 閉じた項目だけ false。キーが無い項目は使える */
    trialFeatures: Record<string, boolean>;
}
/** SOL の体験の入口 */
export declare const SOL_TRIAL_URL = "https://class-portal-kids.vercel.app/#trial";
/** いまわかっている設定（まだ読んでいなければ、前に覚えた値。それも無ければ null） */
export declare function getPortalConfig(): PortalAppConfig | null;
export declare function subscribePortalConfig(cb: (c: PortalAppConfig | null) => void): () => void;
/** サーバから読みなおす。読めなければ前の値のまま（null を返す） */
export declare function loadPortalConfig(config: ResolveConfig): Promise<PortalAppConfig | null>;
/**
 * 体験中に、その項目を使えるか。体験中でなければ いつも true。
 * 設定がまだ読めていない・項目の設定が無い ときは使える（はじめの設定は「全部使える」）。
 */
export declare function trialAllows(key: string | null | undefined, cfg?: PortalAppConfig | null): boolean;
/** 体験を1回数える（タブごとに1回だけ。答えの中身は送らない） */
export declare function trialHit(config: ResolveConfig): Promise<void>;
export interface TrialAppEntry {
    appId: string;
    title: string;
    subject: string | null;
    grade: number | null;
    url: string;
}
/** SOL の体験の入口に並べるアプリ（体験に出す設定のものだけ） */
export declare function fetchTrialApps(config: ResolveConfig): Promise<TrialAppEntry[] | null>;
/** 体験の入口から開くリンク（アプリのアドレスの最後に #trial） */
export declare function buildTrialUrl(appUrl: string): string;
/** テスト用 */
export declare function _setPortalConfigForTest(c: PortalAppConfig | null): void;
//# sourceMappingURL=portalConfig.d.ts.map