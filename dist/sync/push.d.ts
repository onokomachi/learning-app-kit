/**
 * zustand を使っていないアプリ向けの、明示的な送信口。
 *
 * createSyncedStorage は zustand の persist に差し込む前提なので、
 * 素の useState と localStorage で書かれたアプリ（国語の読解アプリなど）では使えない。
 * そういうアプリは、自分の状態を rows に変換してこの関数を呼ぶ。
 *
 * 送信に失敗しても投げない。学習を止めないことを、届くことより優先する。
 */
import type { SyncConfig } from './types.js';
/** 送信する1スキルぶん。skill_id はカタログと同じ文字列にする。 */
export interface PushRow {
    skill_id: string;
    attempts: number;
    corrects: number;
    perfect_streak?: number;
    box?: number | null;
    next_due_ts?: number | null;
    last_ts?: number | null;
}
export interface PushResult {
    ok: boolean;
    /** サーバが実際に受理した件数。巻き戻し防止で弾かれた行は含まれない */
    pushed: number;
    error?: string;
}
export type PushConfig = Pick<SyncConfig, 'appId' | 'supabaseUrl' | 'supabaseKey'>;
/**
 * 学習記録を学級ポータルへ送る。
 * supabaseUrl / supabaseKey が無ければ何もしない（設定し忘れても壊れない）。
 */
export declare function pushSkillState(config: PushConfig, rows: PushRow[]): Promise<PushResult>;
/**
 * 送信をまとめる。何度呼んでも、最後の呼び出しから wait ミリ秒たってから1回だけ送る。
 * 画面の操作ごとに呼んでよい形にするためのもの。
 */
export declare function createPusher(config: PushConfig, wait?: number): (rows: PushRow[], onDone?: (r: PushResult) => void) => void;
//# sourceMappingURL=push.d.ts.map