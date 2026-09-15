/**
 * カタログの登録簿と引き当て。
 *
 * 新しい単元アプリを足すときの作業はここだけ:
 *   1. scripts/gen-catalog.ts でそのアプリの catalog を生成する
 *   2. src/catalog/<app_id>.ts として置く
 *   3. 下の CATALOGS に1行足す
 * バックエンドのテーブルは一切変わらない。
 */
import type { AppCatalog, ResolvedSkill } from './types.js';
export type { AppCatalog, ResolvedSkill, MisconceptionEntry } from './types.js';
export type { ModuleEntry, SkillEntry } from './types.js';
/** app_id → カタログ。新しいアプリはここに足す。 */
export declare const CATALOGS: Record<string, AppCatalog>;
/** 登録済みのアプリ一覧（ダッシュボードの単元セレクタなどに使う） */
export declare function listApps(): AppCatalog[];
/**
 * 記号（app_id + skill_id）を、人が読めるものに戻す。
 * 未登録のアプリや未知の skillId では null を返す
 * ——「知らない記号が来たら黙って捨てる」のではなく、呼び出し側に判断させる。
 */
export declare function lookupSkill(appId: string, skillId: string): ResolvedSkill | null;
/** 表示用の短い名前。カタログに無い記号は skillId をそのまま返す（画面が空にならないように）。 */
export declare function skillLabel(appId: string, skillId: string): string;
/** その誤概念を扱っている skillId の一覧を引く。誤概念別の集計に使う。 */
export declare function skillsForMisconception(appId: string, code: string): string[];
//# sourceMappingURL=index.d.ts.map