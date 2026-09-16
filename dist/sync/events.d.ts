/**
 * 学習の出来事（1問ごとの記録）をサーバへ送る。
 *
 * skill_state は「今どこまで到達しているか」のスナップショットで、
 * いつ・どれだけ取り組んだかが残らない。努力の可視化も、伸びのグラフも、
 * 成績処理も、時刻つきの出来事そのものが無いと作れない。
 *
 * 端末側には元から `logs`（直近200件・時刻つき）が溜まっている。
 * つまり新しく記録を取り始める必要はなく、すでにあるものを送るだけでよい。
 * そのためアプリ側のコードは1行も変わらない。
 *
 * 二重送信は event_id でサーバが弾く。だから「送れたところまで」を
 * 端末が覚えておき、失敗したら次の機会に送り直せばよい（下の高水位マーク）。
 */
import type { LogLike } from './types.js';
import type { PushConfig, PushResult } from './push.js';
/** サーバへ送る1件。skill_id はカタログと同じ文字列にする。 */
export interface EventRow {
    event_id: string;
    skill_id: string;
    module_id?: string;
    label?: string;
    correct: boolean;
    ts: number;
    /** 本番テストのときだけ。点数と大問ごとの正誤 */
    detail?: unknown;
}
/**
 * どこまで送れたか（端末の時刻・ミリ秒）。
 * これ以降の出来事だけを送る。読めなければ0＝全部送る、で安全側に倒す。
 */
export declare function getSentMark(appId: string): number;
export declare function setSentMark(appId: string, ts: number): void;
/**
 * マークを消す＝次回に全部送り直す。
 * 名乗りが後から決まったときに使う。すでに送った出来事にも
 * 「誰のものか」を付け直すには、もう一度通す必要があるため。
 */
export declare function clearSentMark(appId: string): void;
/**
 * 端末のログを、まだ送っていない分だけ送信用に変換する。
 * 古い順に並べて返すので、途中で打ち切られても「古い方から確実に埋まる」。
 */
export declare function toEventRows(logs: readonly LogLike[] | undefined, sinceTs: number): EventRow[];
/**
 * 出来事を送る。設定が無ければ何もしない（設定し忘れても壊れない）。
 * 送信の失敗で学習を止めないので、例外は投げない。
 */
export declare function pushEvents(config: PushConfig, rows: EventRow[]): Promise<PushResult>;
/**
 * 「まだ送っていない分を送り、送れたところまでを覚える」までを1つにしたもの。
 * マークは**成功したときだけ**進める。失敗したら次の機会に同じ分をもう一度送る。
 */
export declare function flushEvents(config: PushConfig, logs: readonly LogLike[] | undefined): Promise<PushResult>;
//# sourceMappingURL=events.d.ts.map