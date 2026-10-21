import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanmonUnits, openUnitKeys, SANMON_UNITS, type SanmonStatus } from './index.js';
import { CATALOGS } from '../catalog/index.js';

const empty: SanmonStatus = { stamina: 0, earnedToday: 0, apps: {} };

test('アプリが無い3つの町だけが、はじめから開いている', () => {
  assert.deepEqual([...openUnitKeys(sanmonUnits(empty))].sort(), ['angle', 'bignum', 'graph']);
});

test('町のアプリは、どれもカタログに登録されている', () => {
  for (const u of SANMON_UNITS) if (u.appId) assert.ok(CATALOGS[u.appId], `${u.key}: ${u.appId} のカタログが無い`);
});

test('4つのうち1つでも足りなければ開かない／全部そろえば開く', () => {
  const c = CATALOGS.gaisu;
  const all = c.modules.flatMap((m) => m.skills.map((s) => s.skill_id));
  const full = { mastered: all, tests: { 'mock-test': 3 }, trial: 0.5, solo_days: 3 };
  const unit = (rec: SanmonStatus['apps'][string]) => sanmonUnits({ ...empty, apps: { gaisu: rec } }).find((u) => u.key === 'rounding')!;
  assert.equal(unit(full).open, true);
  assert.equal(unit({ ...full, tests: { 'mock-test': 2 } }).open, false, 'テストはちがう日に3回');
  assert.equal(unit({ ...full, trial: 0.3 }).open, false, '階段は半分');
  assert.equal(unit({ ...full, solo_days: 2 }).open, false, 'ねばりは3日');
  assert.equal(unit({ ...full, mastered: all.slice(0, Math.floor(all.length * 0.6)) }).open, false, '練習は7割');
  // ボス戦など、カタログの練習項目でないものは練習の数に入らない
  assert.equal(unit({ ...full, mastered: ['boss-normal', 'mock-test', 'eh-judge'] }).practice!.have, 0);
});

test('小数の2つの町は、テストとモジュールで分けて判定する', () => {
  const s = CATALOGS.syousu;
  const all = s.modules.flatMap((m) => m.skills.map((x) => x.skill_id));
  const units = sanmonUnits({ ...empty, apps: { syousu: { mastered: all, tests: { 'mock-test': 3 }, trial: 1, solo_days: 5 } } });
  assert.equal(units.find((u) => u.key === 'decimal')!.open, true);
  assert.equal(units.find((u) => u.key === 'decmuldiv')!.open, false, 'かけ算わり算のテストはまだ');
});
