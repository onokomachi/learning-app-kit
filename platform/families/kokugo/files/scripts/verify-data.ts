/**
 * 問題データの機械チェック。`npm run verify` で走る。
 *
 * 国語の問題は自動生成できないので、人が書いたデータの「形」のまちがいをここで止める。
 * 見ているのは、過去に実際に起きた型（master-DB の patterns/ と bugs/）：
 *   - 本文のセグメント数と場面カードの数の食いちがい（読むモードが壊れる）
 *   - ぬき出しの答えが本文に無い／字数指定と答えの長さがちがう
 *   - ぬき出し問題に下線（答えそのものを指してしまう）
 *   - 選択問題の正解の位置のかたより
 *   - まちがいの選択肢に「読みまちがいの型」が付いていない
 */
import { pages, structure, questions, SKILL_ORDER, MISREADS } from '../src/data';

let errors = 0;
const fail = (msg: string) => { errors++; console.error(`✗ ${msg}`); };

// 1. 本文セグメント数 = 場面カード数（ページごと）
for (const p of pages) {
  const segs = p.text.split('\n').length;
  const cards = structure.filter(s => s.pageId === p.id).length;
  if (segs !== cards) fail(`ページ${p.id}: 本文 ${segs} 区切り / 場面カード ${cards} 枚`);
}

// 2. 問題ごとの形
const ids = new Set<number>();
const positions: number[] = [0, 0, 0, 0];
for (const q of questions) {
  const tag = `設問${q.id}`;
  if (ids.has(q.id)) fail(`${tag}: id が重複`);
  ids.add(q.id);
  const page = pages.find(p => p.id === q.pageId);
  if (!page) { fail(`${tag}: pageId ${q.pageId} のページが無い`); continue; }
  if (!SKILL_ORDER.includes(q.skill)) fail(`${tag}: skill が不正`);

  if (q.targetText && !page.text.includes(q.targetText)) fail(`${tag}: 下線「${q.targetText}」が本文に無い`);

  if (q.type === 'extract') {
    if (q.targetText) fail(`${tag}: ぬき出し問題に下線がある（答えがばれる）`);
    if (!Array.isArray(q.answer) || q.answer.length === 0) { fail(`${tag}: 答えが無い`); continue; }
    if (!q.answer.some(a => page.text.includes(a.replace(/。$/, '')))) fail(`${tag}: 答えが本文に無い`);
    if (q.charCount && !q.answer.some(a => Array.from(a).length === q.charCount)) {
      fail(`${tag}: 字数指定 ${q.charCount} 字に合う答えが無い`);
    }
  }

  if (q.type === 'choice') {
    const n = q.choices?.length ?? 0;
    if (n < 3) fail(`${tag}: 選択肢が ${n} 個`);
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= n) { fail(`${tag}: 正解の位置が範囲外`); continue; }
    positions[q.answer]++;
    if (new Set(q.choices).size !== n) fail(`${tag}: 選択肢が重複`);
    if (!q.misread || q.misread.length !== n) { fail(`${tag}: misread の数が選択肢とちがう`); continue; }
    q.misread.forEach((m, i) => {
      if (i === q.answer && m !== null) fail(`${tag}: 正解の選択肢に misread が付いている`);
      if (i !== q.answer && (m === null || !(m in MISREADS))) fail(`${tag}: まちがいの選択肢${i + 1}に misread が無い`);
    });
  }

  if (q.type === 'free' && (!q.sampleAnswer || !q.points?.length)) fail(`${tag}: 記述問題に解答例かポイントが無い`);
}

// 3. 各場面に、記述以外の問題が2問以上あること（まとめテストで各場面から出すため）
for (const p of pages) {
  const n = questions.filter(q => q.pageId === p.id && q.type !== 'free').length;
  if (n < 2) fail(`ページ${p.id}: 記述以外の問題が ${n} 問しかない`);
}

// 4. 正解の位置のかたより（3択で、どこか1つが半分をこえたら止める）
const total = positions.reduce((a, b) => a + b, 0);
console.log(`正解の位置: ①${positions[0]} ②${positions[1]} ③${positions[2]}（${total}問）`);
if (positions.some(c => c > total / 2)) fail('正解の位置がかたよっている');

// 5. 読みの力ごとの問題数（目で見る用）
for (const s of SKILL_ORDER) {
  console.log(`  ${s}: ${questions.filter(q => q.skill === s).length}問`);
}

if (errors > 0) {
  console.error(`\n${errors} 件の問題があります`);
  process.exit(1);
}
console.log(`\n✓ ${questions.length}問・${pages.length}ページ すべてOK`);
