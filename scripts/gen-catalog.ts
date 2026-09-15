/**
 * 単元アプリから catalog を生成する。
 *
 * 使い方（単元アプリのリポジトリ側にコピーして実行する）:
 *   npx tsx gen-catalog.ts > /path/to/learning-app-kit/src/catalog/<app_id>.ts
 *
 * 前提: アプリが MODULE_LEVELS / ALL_SKILL_IDS / generate を export していること。
 * これらが無い旧世代のアプリは、手で書くか、先にその形に揃える。
 *
 * 誤答診断(diagnose)の誤概念タクソノミは coverage-audit.ts の COVERAGE 定義から
 * 正規表現で拾う。ここはアプリごとに書き方が違うので、生成後に目視で確かめること。
 */
import { readFileSync } from 'node:fs';

export interface GenOptions {
  appId: string;
  title: string;
  subject: string;
  grade: number;
  url?: string;
  moduleLevels: Record<string, { id: string; label: string; desc: string }[]>;
  moduleTitles: Record<string, string>;
  allSkillIds: readonly string[];
  generate: (skillId: string) => { answer: { kind: string } };
  /** 誤概念を拾う元ファイル。省略すると誤概念なしのカタログになる */
  coverageAuditPath?: string;
}

/** coverage-audit.ts から 誤概念コード・説明・対象skillId を拾う */
export function extractMisconceptions(path: string) {
  const src = readFileSync(path, 'utf-8');
  const re = /source:\s*'(誤概念[^']+)',\s*\n\s*label:\s*'([^']+)',\s*\n\s*skills:\s*\[([^\]]*)\]/g;
  const out: { code: string; label: string; skills: string[] }[] = [];
  for (const m of src.matchAll(re)) {
    out.push({ code: m[1]!, label: m[2]!, skills: [...m[3]!.matchAll(/'([^']+)'/g)].map((x) => x[1]!) });
  }
  return out;
}

export function buildCatalog(o: GenOptions) {
  const modules = Object.entries(o.moduleLevels).map(([moduleId, levels]) => ({
    module_id: moduleId,
    title: o.moduleTitles[moduleId] ?? moduleId,
    skills: levels.map((l) => {
      let answer_kind = '?';
      try { answer_kind = o.generate(l.id).answer.kind; } catch { /* 生成できないものは ? のまま残す */ }
      return { skill_id: l.id, label: l.label, desc: l.desc, answer_kind };
    }),
  }));
  return {
    app_id: o.appId, title: o.title, subject: o.subject, grade: o.grade,
    ...(o.url ? { url: o.url } : {}),
    generated_at: new Date().toISOString().slice(0, 10),
    skill_count: o.allSkillIds.length,
    modules,
    misconceptions: o.coverageAuditPath ? extractMisconceptions(o.coverageAuditPath) : [],
  };
}

/** そのまま src/catalog/<app_id>.ts として保存できる TypeScript を返す */
export function renderCatalogModule(catalog: ReturnType<typeof buildCatalog>): string {
  return `/**
 * 自動生成されたカタログ: ${catalog.title}
 *
 * 手で編集しないこと。アプリ側の MODULE_LEVELS / coverage-audit.ts が正本で、
 * scripts/gen-catalog.ts で再生成する。
 */
import type { AppCatalog } from './types.js';

export const ${catalog.app_id}: AppCatalog = ${JSON.stringify(catalog, null, 2)};
`;
}
