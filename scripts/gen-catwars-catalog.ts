/**
 * カタログ catwars（CAT-WARS：小4算数のごほうびゲーム）を、kit の SANMON_UNITS と単元アプリのカタログから作る。
 *
 *   npx tsx scripts/gen-catwars-catalog.ts > src/catalog/catwars.ts
 *
 * CAT-WARS は戦闘の中で単元アプリと同じ問題を出し、記録を app_id 'catwars'・skill_id＝単元アプリの skill_id で送る
 * （module_id は町の key）。PRISM が項目の名前を引けるよう、ここで「町 → その町の単元アプリの項目」の表を作る。
 *
 * 決め方は CAT-WARS の catwars/learn/gradePack.ts と同じ:
 *   - 町（モジュール）は SANMON_UNITS のうち単元アプリのある町（並びも同じ）
 *   - 項目はその単元アプリのカタログの modules（本番テストなどの extra は入れない）。町の modules があれば その分だけ
 *   - わり算の筆算は2つの町に分ける：筆算そのもの hissan-?-1 は ÷1けた、hissan-?-2・?-3 は ÷2けた。ほかの項目は下の きまりで ÷1けた に入る
 *   - 1つの項目は1つの町にだけ入れる（カタログの中で skill_id を一意にするきまり。lookupSkill も先の町を返す）。
 *     わり算の筆算の共有の項目（検算など）は先の町（÷1けた）に入る。CAT-WARS が送る module_id（町）とは ずれることがある
 * url は apps.url と同じ（2026-11-16 CW-5c で入れた。SOL の SANMON タブの入口・体験の入口が使う）。
 * SOL の「じぶんの きろく」・ふくしゅう・単元の一覧は url があると アプリへのボタンを出すので、SOL の側（lib/solApps.ts の onSol）で外している。
 * 単元アプリのカタログ・SANMON_UNITS を変えたら、作り直す。
 */
import { CATALOGS } from '../src/catalog/index.js';
import { SANMON_UNITS } from '../src/sanmon/index.js';
import type { AppCatalog, ModuleEntry } from '../src/catalog/types.js';

/** gradePack.ts の unitAccepts と同じ */
const unitAccepts = (unitKey: string, skillId: string): boolean => {
  const m = /^hissan-\d-(\d)$/.exec(skillId);
  if (!m) return true;
  if (unitKey === 'div1') return m[1] === '1';
  if (unitKey === 'div2') return m[1] !== '1';
  return true;
};

const modules: ModuleEntry[] = [];
const seen = new Set<string>();
for (const u of SANMON_UNITS) {
  if (!u.appId) continue;
  const c = CATALOGS[u.appId];
  if (!c) throw new Error(`${u.key}: ${u.appId} のカタログが無い`);
  const skills = c.modules
    .filter((m) => !u.modules || u.modules.includes(m.module_id))
    .flatMap((m) => m.skills)
    .filter((s) => unitAccepts(u.key, s.skill_id) && !seen.has(s.skill_id))
    .map((s) => ({ skill_id: s.skill_id, label: s.label, desc: s.desc, answer_kind: s.answer_kind }));
  for (const s of skills) seen.add(s.skill_id);
  modules.push({ module_id: u.key, title: u.name, skills });
}

const catalog: AppCatalog = {
  app_id: 'catwars',
  title: 'CAT-WARS',
  subject: 'ゲーム',
  grade: 4,
  url: 'https://battlemath04catwars.vercel.app',
  generated_at: process.env.GEN_DATE ?? new Date().toISOString().slice(0, 10),
  skill_count: modules.reduce((n, m) => n + m.skills.length, 0),
  modules,
  misconceptions: [],
};

process.stdout.write(`/**
 * 自動生成されたカタログ: CAT-WARS（小4算数のごほうびゲーム）
 *
 * 手で編集しないこと。scripts/gen-catwars-catalog.ts で再生成する
 * （単元アプリのカタログ・SANMON_UNITS から作る。モジュール＝町、項目＝その町の単元アプリの skill_id）。
 * 教科「ゲーム」：SOL の単元の一覧には出ない（SANMON と同じ）。url は apps.url と同じ（SOL の SANMON タブ・体験の入口が使う）。
 */
import type { AppCatalog } from './types.js';

export const catwars: AppCatalog = ${JSON.stringify(catalog, null, 2)};
`);
