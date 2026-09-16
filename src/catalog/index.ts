/**
 * カタログの登録簿と引き当て。
 *
 * 新しい単元アプリを足すときの作業はここだけ:
 *   1. scripts/gen-catalog.ts でそのアプリの catalog を生成する
 *   2. src/catalog/<app_id>.ts として置く
 *   3. 下の CATALOGS に1行足す
 * バックエンドのテーブルは一切変わらない。
 */
import type { AppCatalog, ResolvedSkill, MisconceptionEntry } from './types.js';
import { hitotsunohana } from './hitotsunohana.js';
import { tsunagi } from './tsunagi.js';
import { upandloose } from './upandloose.js';
import { suihei } from './suihei.js';
import { bai } from './bai.js';
import { gaisu } from './gaisu.js';
import { hissan } from './hissan.js';
import { kakudaizu } from './kakudaizu.js';
import { karakuri } from './karakuri.js';
import { kawari } from './kawari.js';
import { suusei } from './suusei.js';
import { syousu } from './syousu.js';

export type { AppCatalog, ResolvedSkill, MisconceptionEntry } from './types.js';
export type { ModuleEntry, SkillEntry } from './types.js';

/** app_id → カタログ。新しいアプリはここに足す。 */
export const CATALOGS: Record<string, AppCatalog> = Object.fromEntries(
  [hitotsunohana, upandloose, tsunagi, suihei, bai, gaisu, hissan, kakudaizu, karakuri, kawari, suusei, syousu].map((c) => [c.app_id, c]),
);

/** 登録済みのアプリ一覧（ダッシュボードの単元セレクタなどに使う） */
export function listApps(): AppCatalog[] {
  return Object.values(CATALOGS).sort(
    (a, b) => a.grade - b.grade || a.subject.localeCompare(b.subject) || a.app_id.localeCompare(b.app_id),
  );
}

/**
 * 記号（app_id + skill_id）を、人が読めるものに戻す。
 * 未登録のアプリや未知の skillId では null を返す
 * ——「知らない記号が来たら黙って捨てる」のではなく、呼び出し側に判断させる。
 */
export function lookupSkill(appId: string, skillId: string): ResolvedSkill | null {
  const app = CATALOGS[appId];
  if (!app) return null;
  for (const mod of app.modules) {
    const skill = mod.skills.find((s) => s.skill_id === skillId);
    if (!skill) continue;
    return {
      app_id: app.app_id,
      app_title: app.title,
      subject: app.subject,
      grade: app.grade,
      module_id: mod.module_id,
      module_title: mod.title,
      skill_id: skill.skill_id,
      label: skill.label,
      desc: skill.desc,
      answer_kind: skill.answer_kind,
      misconceptions: app.misconceptions.filter((m) => m.skills.includes(skillId)),
    };
  }
  return null;
}

/** 表示用の短い名前。カタログに無い記号は skillId をそのまま返す（画面が空にならないように）。 */
export function skillLabel(appId: string, skillId: string): string {
  return lookupSkill(appId, skillId)?.label ?? skillId;
}

/** その誤概念を扱っている skillId の一覧を引く。誤概念別の集計に使う。 */
export function skillsForMisconception(appId: string, code: string): string[] {
  return CATALOGS[appId]?.misconceptions.find((m) => m.code === code)?.skills ?? [];
}

/** 教科の一覧（重複なし・登録順）。ダッシュボードの絞り込みに使う。 */
export function listSubjects(): string[] {
  return [...new Set(listApps().map((a) => a.subject))];
}

/** 学年の一覧（昇順）。 */
export function listGrades(): number[] {
  return [...new Set(listApps().map((a) => a.grade))].sort((a, b) => a - b);
}
