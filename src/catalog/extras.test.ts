/**
 * アプリが実際に送ってくる記号が、すべて辞書で意味に戻せることを確かめる。
 *
 * ここが抜けると、記録は正しく届いているのに教師の画面では
 * 「カタログに無い記号」という1つの山になる（実際にそうなっていた）。
 * 下の一覧は、12アプリのソースを `skillId:` で洗い出したもの。
 * アプリに新しい遊び方を足したら、ここにも足す。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookupSkill, CATALOGS, listApps } from './index.js';

/** アプリが送ってくる、レベル表に載っていない記号 */
const RECORDED_EXTRAS: Record<string, string[]> = {
  bai: ['mock-test', 'boss-normal', 'boss-hard', 'boss-god', 'eh-judge', 'eh-fix'],
  gaisu: ['mock-test', 'boss-normal', 'boss-hard', 'boss-god', 'eh-judge', 'eh-fix'],
  suusei: ['mock-test', 'boss-normal', 'boss-hard', 'boss-god', 'eh-judge', 'eh-fix'],
  karakuri: ['mock-test', 'boss-normal', 'boss-hard', 'boss-god', 'eh-judge', 'fix-rule'],
  kawari: ['mock-test', 'boss-normal', 'boss-hard', 'boss-god'],
  suihei: ['mock-test', 'boss-normal', 'boss-hard', 'boss-god'],
  kakudaizu: [
    'mock-test', 'boss-normal', 'boss-hard', 'boss-god',
    'eh-pair', 'eh-inverse', 'eh-unit', 'eh-flip', 'eh-additive', 'eh-angle',
  ],
  hissan: [
    'mock-test', 'mock-hissan', 'boss-normal', 'boss-hard', 'boss-god',
    'eh-judge', 'eh-fix', 'eh-zero', 'eh-zerotail', 'eh-rembig', 'eh-sub', 'eh-rule10', 'eh-place',
    'hissan-2-1', 'hissan-3-1', 'hissan-2-2', 'hissan-3-2', 'hissan-3-3',
  ],
  syousu: [
    'mock-test', 'decompose-3', 'judge-correct', 'fix-number', 'fix-sign',
    'addsub-build-add-basic', 'addsub-build-add-diff', 'addsub-build-sub-basic',
    'addsub-build-sub-diff', 'addsub-build-sub-whole',
    'addsub-master-add-basic', 'addsub-master-add-diff', 'addsub-master-sub-basic',
    'addsub-master-sub-diff', 'addsub-master-sub-whole',
    'line-read-line-tenths', 'line-read-line-0to10', 'line-read-line-hundredths',
    'wp-+', 'wp--', 'wp-×', 'wp-÷',
  ],
};

test('アプリが送ってくる記号は、ひとつ残らず意味に戻せる', () => {
  const unresolved: string[] = [];
  for (const [appId, ids] of Object.entries(RECORDED_EXTRAS)) {
    for (const id of ids) if (!lookupSkill(appId, id)) unresolved.push(`${appId}/${id}`);
  }
  assert.deepEqual(unresolved, [], '「カタログに無い記号」として積み上がるものが残っている');
});

test('遊び方の記号は is_extra が立ち、レベル表の項目は立たない', () => {
  assert.equal(lookupSkill('hissan', 'mock-test')?.is_extra, true);
  assert.equal(lookupSkill('hissan', 'boss-god')?.is_extra, true);
  assert.equal(lookupSkill('hissan', 'check-rem')?.is_extra, false);
});

test('本番テストとボス戦は、どのアプリでも同じ記号で引ける（新しいアプリでも通る）', () => {
  for (const a of listApps()) {
    assert.ok(lookupSkill(a.app_id, 'mock-test'), `${a.app_id} の本番テストが引けない`);
    assert.ok(lookupSkill(a.app_id, 'boss-hard'), `${a.app_id} のボス戦が引けない`);
  }
});

test('skill_count は遊び方のぶんだけ増えない（到達度の分母を守る）', () => {
  for (const a of listApps()) {
    const levels = a.modules.reduce((s, m) => s + m.skills.length, 0);
    assert.equal(levels, a.skill_count, `${a.app_id} の分母が遊び方でふくらんでいる`);
    assert.ok((a.extra_modules?.length ?? 0) > 0, `${a.app_id} に遊び方の辞書が付いていない`);
  }
});

test('同じ module_id の遊び方は1つにまとまる（画面に同じ見出しが2つ出ない）', () => {
  for (const a of Object.values(CATALOGS)) {
    const ids = (a.extra_modules ?? []).map((m) => m.module_id);
    assert.equal(new Set(ids).size, ids.length, `${a.app_id} に同じ module_id が2つある`);
  }
});

test('レベル表に同じ記号があれば、そちらを優先する', () => {
  // suihei のレベル表には eh-line などがある。遊び方の辞書に隠されない
  const r = lookupSkill('suihei', 'eh-line');
  assert.equal(r?.is_extra, false);
});
