import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanmonUnits, openUnitKeys, SANMON_UNITS, SANMON_MODES, isModeOpen, modeLockMessage, inSchoolHoursLocal, offlineModes, sanmonShards, levelCapFor, SANMON_GROWTH, type SanmonStatus, type SanmonModes, type SanmonModeKey } from './index.js';
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

test('モードの開け閉め: 書いていないモードは開いている・false だけ閉じる', () => {
  assert.equal(isModeOpen({}, 'speed'), true);
  assert.equal(isModeOpen(null, 'class_duel'), true);
  assert.equal(isModeOpen({ speed: false }, 'speed'), false);
  assert.equal(isModeOpen({ speed: false }, 'adventure'), true);
  assert.equal(new Set(SANMON_MODES.map((m) => m.key)).size, SANMON_MODES.length, 'キーが重ならない');
});

test('かけら: アプリの単元はテストの日（5日まで）と階段の段、アプリが無い単元は SANMON の練習', () => {
  const none = sanmonShards(null);
  assert.ok(none.every((u) => u.shards === 0 && u.cap === SANMON_GROWTH.baseCap));
  const sanmonBig = CATALOGS.sanmon!.modules.find((m) => m.module_id === 'bignum')!.skills.map((s) => s.skill_id);
  const st: SanmonStatus = {
    stamina: 0, earnedToday: 0,
    apps: {
      gaisu: { mastered: [], tests: { 'mock-test': 9 }, trial: 0.75, solo_days: 3 },
      sanmon: { mastered: sanmonBig.slice(0, Math.ceil(sanmonBig.length / 2)), tests: {}, trial: 0, solo_days: 0 },
    },
  };
  const by = Object.fromEntries(sanmonShards(st).map((u) => [u.key, u]));
  assert.deepEqual(by.rounding!.from, { test: 5, trial: 2, practice: 0 });
  assert.equal(by.rounding!.shards, 7);
  assert.equal(by.rounding!.cap, 55);
  assert.ok(by.bignum!.from.practice >= 4 && by.bignum!.from.practice <= 5);
  assert.equal(by.div1!.shards, 0);
  // 町が開く条件（テスト3日・階段半分）をそろえた単元は、上限40まで育てられる
  const opened = sanmonShards({ ...st, apps: { hissan: { mastered: [], tests: { 'mock-test': 3 }, trial: 0.5, solo_days: 3 } } });
  assert.equal(opened.find((u) => u.key === 'div1')!.cap, 40);
  assert.equal(levelCapFor(100), SANMON_GROWTH.maxCap);
});


const sh = { enabled: true, active: true, start: '08:00', end: '15:30', modes: ['adventure', 'speed', 'monster', 'class_duel'] as SanmonModeKey[], base: { speed: false } };

test('平日モード: サーバが閉じたモードは、授業の時間の文を出す。先生が閉じただけのモードは前の文', () => {
  const modes: SanmonModes = { adventure: false, speed: false, monster: false, class_duel: false, _school_hours: sh };
  assert.ok(String(modeLockMessage(modes, 'adventure')).includes('15:30から'));
  assert.equal(modeLockMessage(modes, 'practice'), null);
  const teacherOnly: SanmonModes = { speed: false, _school_hours: { ...sh, active: false } };
  assert.equal(modeLockMessage(teacherOnly, 'speed'), '先生が まだ ひらいていないよ');
  assert.equal(modeLockMessage(teacherOnly, 'adventure'), null);
});

test('平日モード: 端末の時計の判定は日本時間の 月〜金・開始以上・終了より前', () => {
  // 2026-10-26 は月曜。UTC 0:00 = 日本時間 9:00
  assert.equal(inSchoolHoursLocal(sh, new Date('2026-10-26T00:00:00Z')), true);
  assert.equal(inSchoolHoursLocal(sh, new Date('2026-10-26T06:30:00Z')), false); // 15:30 ちょうどは開く
  assert.equal(inSchoolHoursLocal(sh, new Date('2026-10-25T22:59:00Z')), false); // 7:59
  assert.equal(inSchoolHoursLocal(sh, new Date('2026-10-25T00:00:00Z')), false); // 日曜
});

test('平日モード: 通信が切れたときは、前に読めた設定で閉じる（先生の開け閉めは base から）', () => {
  const cached: SanmonModes = { _school_hours: { ...sh, active: false } };
  const m = offlineModes(cached, new Date('2026-10-26T01:00:00Z'));
  assert.equal(isModeOpen(m, 'adventure'), false);
  assert.equal(isModeOpen(m, 'practice'), true);
  const after = offlineModes(cached, new Date('2026-10-26T07:00:00Z'));
  assert.equal(isModeOpen(after, 'adventure'), true);
  assert.equal(isModeOpen(after, 'speed'), false); // 先生が閉じている
  const opened = offlineModes({ _school_hours: { ...sh, open_until: '2026-10-26T02:00:00Z' } }, new Date('2026-10-26T01:00:00Z'));
  assert.equal(isModeOpen(opened, 'adventure'), true); // 「いまだけ開ける」のあいだ
});

