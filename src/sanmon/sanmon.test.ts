import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanmonBattleCost, sanmonTownMastery, SCHOOL_HOURS_MODES, SCHOOL_HOURS_DEFAULT, SANMON_MODES_DEFAULT_CLOSED, SANMON_RULES, isSchoolHoursLocked, staminaForTown, sanmonTownKeyOf, sanmonUnits, openUnitKeys, SANMON_UNITS, SANMON_MODES, isModeOpen, modeLockMessage, inSchoolHoursLocal, offlineModes, sanmonShards, levelCapFor, SANMON_GROWTH, type SanmonStatus, type SanmonModes, type SanmonModeKey } from './index.js';
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

test('わり算の筆算の2つの町は、筆算そのものの項目も練習に数え、同じ条件で開く', () => {
  const core = ['hissan-2-1', 'hissan-3-1', 'hissan-2-2', 'hissan-3-2', 'hissan-3-3'];
  const units = sanmonUnits({ ...empty, apps: { hissan: { mastered: core, tests: {}, trial: 0, solo_days: 0 } } });
  const d1 = units.find((u) => u.key === 'div1')!;
  const d2 = units.find((u) => u.key === 'div2')!;
  assert.equal(d1.practice!.have, 5);
  assert.deepEqual(d1.practice, d2.practice);
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


test('町のスタミナ：その町で使える分は 町＋共通。アプリの無い町は共通だけ', () => {
  const st = { stamina: 10, towns: { rounding: 23 } };
  assert.deepEqual(staminaForTown(st, 'rounding'), { town: 23, common: 10, total: 33 });
  assert.deepEqual(staminaForTown(st, 'angle'), { town: 0, common: 10, total: 10 });
  assert.deepEqual(staminaForTown({ stamina: 4 }, null), { town: 0, common: 4, total: 4 });
  assert.equal(sanmonTownKeyOf('がい数'), 'rounding');
  assert.equal(sanmonTownKeyOf('わり算の筆算(÷2けた)'), 'div2');
  assert.equal(sanmonTownKeyOf('ないもの'), null);
});


test('CAT-WARS の鍵: 書いていなければ閉じている・true で開く。既存の鍵は今までどおり', () => {
  assert.deepEqual([...SANMON_MODES_DEFAULT_CLOSED], ['catwars']);
  assert.ok(SANMON_MODES.some((m) => m.key === 'catwars'));
  assert.equal(isModeOpen({}, 'catwars'), false);
  assert.equal(isModeOpen(null, 'catwars'), false);
  assert.equal(isModeOpen(undefined, 'catwars'), false);
  assert.equal(isModeOpen({ catwars: true }, 'catwars'), true);
  assert.equal(isModeOpen({ catwars: false }, 'catwars'), false);
  for (const k of ['adventure', 'speed', 'monster', 'class_duel', 'practice', 'review', 'mock_test'] as SanmonModeKey[]) {
    assert.equal(isModeOpen({}, k), true, k);
    assert.equal(isModeOpen(null, k), true, k);
    assert.equal(isModeOpen({ [k]: false }, k), false, k);
  }
  assert.equal(modeLockMessage({}, 'catwars'), '先生が まだ ひらいていないよ');
  assert.equal(modeLockMessage({ catwars: true }, 'catwars'), null);
});

test('CAT-WARS の鍵: 平日モードの対象・はじめの値に入る。授業の時間の文は 先生が開いているときだけ', () => {
  assert.ok((SCHOOL_HOURS_MODES as readonly string[]).includes('catwars'));
  assert.ok(SCHOOL_HOURS_DEFAULT.modes.includes('catwars'));
  const sh5 = { ...sh, modes: [...SCHOOL_HOURS_MODES] as SanmonModeKey[] };
  // 先生が開いている → 授業の時間で閉じている
  const opened: SanmonModes = { catwars: false, adventure: false, _school_hours: { ...sh5, base: { catwars: true } } };
  assert.equal(isSchoolHoursLocked(opened, 'catwars'), true);
  assert.ok(String(modeLockMessage(opened, 'catwars')).includes('15:30から'));
  // 先生がまだ開いていない → 時間がきても開かないので「先生が まだ」
  const notYet: SanmonModes = { catwars: false, _school_hours: { ...sh5, base: { catwars: false } } };
  assert.equal(modeLockMessage(notYet, 'catwars'), '先生が まだ ひらいていないよ');
  // 古いサーバ（base に catwars が無い）も「先生が まだ」
  assert.equal(modeLockMessage({ _school_hours: { ...sh5, base: {} } }, 'catwars'), '先生が まだ ひらいていないよ');
});

test('CAT-WARS の鍵: 通信が切れたとき', () => {
  // 先生が開いていて、授業の時間 → 閉じる。時間外 → 開く
  const cached: SanmonModes = { _school_hours: { ...sh, modes: [...SCHOOL_HOURS_MODES] as SanmonModeKey[], active: false, base: { catwars: true } } };
  assert.equal(isModeOpen(offlineModes(cached, new Date('2026-10-26T01:00:00Z')), 'catwars'), false);
  assert.equal(isModeOpen(offlineModes(cached, new Date('2026-10-26T07:00:00Z')), 'catwars'), true);
  // 古いサーバの base（catwars が無い）・平日モードの対象外 → 書いていないので閉じたまま
  const oldBase: SanmonModes = { _school_hours: { ...sh, active: false, base: {} } };
  assert.equal(isModeOpen(offlineModes(oldBase, new Date('2026-10-26T07:00:00Z')), 'catwars'), false);
  assert.equal(isModeOpen(offlineModes(oldBase, new Date('2026-10-26T07:00:00Z')), 'adventure'), true);
});

test('バトル1回のスタミナ: 町の達成度（サーバの _sanmon_town_cost と同じ）', () => {
  const all = (appId: string, mods?: string[]) => CATALOGS[appId]!.modules.filter((m) => !mods || mods.includes(m.module_id)).flatMap((m) => m.skills.map((s) => s.skill_id));
  const g = all('gaisu');
  const st = (mastered: string[]) => ({ apps: { gaisu: { mastered, tests: {}, trial: 0, solo_days: 0 } } });
  assert.equal(sanmonBattleCost(st([]), 'rounding'), 5);
  assert.equal(sanmonBattleCost(st(g.slice(0, Math.ceil(g.length / 2))), 'rounding'), 4);
  assert.equal(sanmonBattleCost(st(g.slice(0, Math.ceil(g.length * 0.75))), 'rounding'), 3);
  assert.equal(sanmonBattleCost(st(g), 'rounding'), 2);
  assert.equal(sanmonTownMastery(st(g), 'rounding'), 1);
  // アプリの無い町は 3、町の無いバトル・知らない町は 5
  for (const k of ['bignum', 'graph', 'angle']) assert.equal(sanmonBattleCost(null, k), SANMON_RULES.noAppTownCost);
  assert.equal(sanmonBattleCost(null, null), SANMON_RULES.battleCost);
  assert.equal(sanmonBattleCost(null, 'nowhere'), 5);
  assert.equal(sanmonTownMastery(null, 'bignum'), null);
  // 小数の2つの町は、それぞれのモジュールだけで数える
  const dec = all('syousu', ['place-value', 'number-line', 'decimal-addsub']);
  const s2 = { apps: { syousu: { mastered: dec, tests: {}, trial: 0, solo_days: 0 } } };
  assert.equal(sanmonBattleCost(s2, 'decimal'), 2);
  assert.equal(sanmonBattleCost(s2, 'decmuldiv'), 5);
});

test('カタログ catwars: 教科「ゲーム」・学年4・町ごとに単元アプリの項目。SANMON の町の計算には入らない', () => {
  const c = CATALOGS.catwars!;
  assert.equal(c.subject, 'ゲーム');
  assert.equal(c.grade, 4);
  assert.equal(c.url, 'https://battlemath04catwars.vercel.app', 'apps.url と同じ（SOL の SANMON タブ・体験の入口が使う）');
  assert.deepEqual(c.modules.map((m) => m.module_id), SANMON_UNITS.filter((u) => u.appId).map((u) => u.key));
  for (const m of c.modules) {
    const u = SANMON_UNITS.find((x) => x.key === m.module_id)!;
    const src = CATALOGS[u.appId!]!;
    for (const s of m.skills) {
      const orig = src.modules.flatMap((x) => x.skills).find((x) => x.skill_id === s.skill_id);
      assert.ok(orig, `${m.module_id}: ${s.skill_id} が ${u.appId} に無い`);
      assert.equal(s.label, orig!.label);
    }
    assert.ok(m.skills.length > 0, m.module_id);
  }
  const div1 = c.modules.find((m) => m.module_id === 'div1')!.skills.map((s) => s.skill_id);
  const div2 = c.modules.find((m) => m.module_id === 'div2')!.skills.map((s) => s.skill_id);
  assert.ok(div1.includes('hissan-2-1') && !div1.includes('hissan-2-2'));
  assert.ok(div2.includes('hissan-2-2') && !div2.includes('hissan-2-1'));
  // 町をまたいで同じ項目は入れない（共有の項目は先の町）
  const ids = c.modules.flatMap((m) => m.skills.map((s) => s.skill_id));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(c.skill_count, ids.length);
  // SANMON の町の解放・かけら は SANMON_UNITS を回すので、catwars があっても変わらない
  assert.ok(sanmonUnits(empty).every((u) => u.appId !== 'catwars'));
  assert.equal(sanmonShards(null).length, SANMON_UNITS.length);
});
