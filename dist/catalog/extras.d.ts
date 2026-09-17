/**
 * カタログに載らない記号の辞書。
 *
 * 生成されたカタログ（<app_id>.ts）は MODULE_LEVELS だけを見ている。
 * ところがアプリは、レベル表に載っていない記号でも記録を送る:
 *
 *   - 本番テストモード      … 'mock-test'（1回ぶんの点数）
 *   - ボス戦                … 'boss-normal' / 'boss-hard' / 'boss-god'
 *   - エラーハンター        … 'eh-judge' / 'eh-fix' など、誤り例ごとの記号
 *   - 本番テストの大問      … 'hissan-3-2' のような、テスト用に切った難度
 *
 * これらが辞書に無いと、教師ダッシュボードで「カタログに無い記号」として
 * ひとまとめに積み上がる。記録は正しく届いているのに、意味だけが失われている状態で、
 * 実際にそれが起きていた。
 *
 * **ここは手で書く。** 生成されたカタログには手を入れない
 * （アプリ側の MODULE_LEVELS が正本のまま保てるように）。
 *
 * 単元の「レベル」ではないので skill_count には数えない。
 * 数えてしまうと「35スキル中いくつ」の分母が、練習していない遊び方のぶんだけ膨らむ。
 */
import type { ModuleEntry } from './types.js';
/**
 * どのアプリにもある遊び方。learning-game スキルのひな形に入っているため、
 * これから作るアプリでも同じ記号になる——だから全アプリに配っておく。
 * 使っていないアプリでは、その記号の記録が来ないだけで害はない。
 */
export declare const COMMON_EXTRA_MODULES: ModuleEntry[];
/**
 * アプリごとの、そのアプリにしか無い記号。
 * app_id → 追加モジュール。
 */
export declare const APP_EXTRA_MODULES: Record<string, ModuleEntry[]>;
//# sourceMappingURL=extras.d.ts.map