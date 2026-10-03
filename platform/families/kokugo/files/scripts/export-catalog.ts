/**
 * 学級ポータル（PRISM）用のカタログを、data.ts から作る。`npm run catalog` で走る。
 *
 * 学習記録は `q-<設問id>` という記号でサーバに届く。カタログはその記号を
 * 「どの場面の・どの読みの力の・どんな問題か」に戻すための辞書。
 * 問題を足したり直したりしたら、これを走らせて learning-app-kit にコミットし、
 * PRISM とハブの learning-app-kit の版を上げる。
 *
 * 出力先: ../learning-app-kit/src/catalog/<appId>.ts（となりに kit があるとき）
 */
import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pages, questions, SKILLS, SKILL_ORDER, MISREADS, type Misread } from '../src/data';
import { UNIT } from '../src/unit';

const KIND_LABEL = { extract: 'ぬき出し', choice: '選択', free: '記述' } as const;
const CIRCLED = '①②③④⑤⑥⑦⑧⑨';

const modules = pages.map(p => ({
  module_id: `scene-${p.id}`,
  title: `${p.paragraphRange} ${p.pageNumber}`,
  skills: questions
    .filter(q => q.pageId === p.id)
    .sort((a, b) => SKILL_ORDER.indexOf(a.skill) - SKILL_ORDER.indexOf(b.skill) || a.id - b.id)
    .map(q => ({
      skill_id: `q-${q.id}`,
      label: `設問${q.id}・${SKILLS[q.skill].label}（${KIND_LABEL[q.type]}）`,
      desc: q.question,
      answer_kind: q.type,
    })),
}));

// 読みまちがいの型 → その型のまちがいの選択肢を持つ設問
const misconceptions = (Object.keys(MISREADS) as Misread[]).map((m, i) => ({
  code: `読みまちがい${CIRCLED[i]}`,
  label: MISREADS[m].label,
  skills: questions.filter(q => q.misread?.includes(m)).map(q => `q-${q.id}`),
}));

const catalog = {
  app_id: UNIT.appId,
  title: UNIT.title,
  subject: '国語',
  grade: 4,
  url: UNIT.url,
  generated_at: new Date().toISOString().slice(0, 10),
  skill_count: questions.length,
  modules,
  misconceptions,
};

const body = `/**
 * 自動生成されたカタログ: ${UNIT.title}（国語）
 *
 * 算数の単元アプリと構造が違う（問題ジェネレータではなく data.ts の静的データ）。
 * モジュール＝${UNIT.sceneWord}、スキル＝設問として並べている。ラベルに読みの力
 * （${SKILL_ORDER.map(s => SKILLS[s].label).join('・')}）を入れ、誤概念の欄には「読みまちがいの型」を入れている。
 * 手で編集しないこと。アプリ側の data.ts が正本で、
 * \`npm run catalog\` で作り直す。
 */
import type { AppCatalog } from './types.js';

export const ${UNIT.appId}: AppCatalog = ${JSON.stringify(catalog, null, 2)};
`;

const out = resolve(import.meta.dirname, `../../learning-app-kit/src/catalog/${UNIT.appId}.ts`);
if (existsSync(resolve(out, '..'))) {
  writeFileSync(out, body);
  console.log(`✓ ${out} に ${questions.length}問を書き出しました`);
} else {
  process.stdout.write(body);
}
