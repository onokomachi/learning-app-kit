import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSchoolTime, currentPlayMode, needsPlayModeAsk, setPlayMode, forceSolo, pairChecker,
  PLAY_MODE_WINDOW_MS,
} from './playMode.js';
import { toEventRows } from './events.js';

function stubLS() {
  const map = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
  return map;
}
const named = () => localStorage.setItem('lak_student_v1',
  JSON.stringify({ studentId: 's1', joinCode: '2643', number: 12 }));

// 2026-09-24（木）の端末時刻。new Date(年, 月-1, 日, 時, 分) は端末の時計で作る
const at = (h: number, m: number, day = 24) => new Date(2026, 8, day, h, m).getTime();

test('isSchoolTime: 平日の 8:40〜15:15 だけ', () => {
  assert.equal(isSchoolTime(new Date(at(8, 39))), false, '8:39 はまだ');
  assert.equal(isSchoolTime(new Date(at(8, 40))), true);
  assert.equal(isSchoolTime(new Date(at(15, 14))), true);
  assert.equal(isSchoolTime(new Date(at(15, 15))), false, '15:15 からは自習の時間');
  assert.equal(isSchoolTime(new Date(at(10, 0, 26))), false, '土曜日');
  assert.equal(isSchoolTime(new Date(at(10, 0, 27))), false, '日曜日');
});

test('needsPlayModeAsk: 学級コードを入れていない子には一切聞かない', () => {
  stubLS();
  assert.equal(needsPlayModeAsk(at(10, 0)), false);
  named();
  assert.equal(needsPlayModeAsk(at(10, 0)), true, 'コードあり・授業の時間・未回答なら聞く');
  assert.equal(needsPlayModeAsk(at(16, 0)), false, '放課後は聞かない（自習＝ソロ扱い）');
});

test('1度答えたら45分は聞かない。45分たったらもう一度聞く', () => {
  stubLS(); named();
  setPlayMode('duo', at(10, 0));
  assert.equal(currentPlayMode(at(10, 44)), 'duo');
  assert.equal(needsPlayModeAsk(at(10, 44)), false);
  assert.equal(currentPlayMode(at(10, 0) + PLAY_MODE_WINDOW_MS), null);
  assert.equal(needsPlayModeAsk(at(10, 45)), true);
});

test('ペアの印: DUOを選んだ時刻から、切り替えるか45分たつまで', () => {
  stubLS(); named();
  setPlayMode('duo', at(10, 0));
  setPlayMode('solo', at(10, 20));   // 途中でひとりに切り替えた
  setPlayMode('duo', at(11, 0));     // 次の時間またペア
  const isPair = pairChecker();
  assert.equal(isPair(at(9, 59)), false);
  assert.equal(isPair(at(10, 5)), true);
  assert.equal(isPair(at(10, 20)), false, '切り替えた時刻からはソロ');
  assert.equal(isPair(at(11, 30)), true);
  assert.equal(isPair(at(11, 45)), false, '45分たったらペアの区間は終わる');
});

test('forceSolo: ペア中ならソロに切り替える（テストなど実力を測る場面）', () => {
  stubLS(); named();
  setPlayMode('duo', at(10, 0));
  assert.equal(forceSolo(at(10, 10)), true);
  assert.equal(currentPlayMode(at(10, 11)), 'solo');
  assert.equal(pairChecker()(at(10, 15)), false);
  assert.equal(forceSolo(at(10, 12)), false, 'すでにソロなら何もしない');
});

test('toEventRows: ペアの時間の練習にだけ pair を付け、本番テストには付けない', () => {
  stubLS(); named();
  setPlayMode('duo', at(10, 0));
  const rows = toEventRows([
    { id: 'a', ts: at(9, 50), skillId: 's', moduleId: 'm', correct: true },
    { id: 'b', ts: at(10, 5), skillId: 's', moduleId: 'm', correct: true },
    { id: 't', ts: at(10, 6), skillId: 'mock-test', moduleId: 'mock-test', correct: false, detail: { total: 50 } },
  ], 0);
  assert.equal(rows.find((r) => r.event_id === 'a')!.pair, undefined, 'ペアになる前');
  assert.equal(rows.find((r) => r.event_id === 'b')!.pair, true);
  assert.equal(rows.find((r) => r.event_id === 't')!.pair, undefined, '本番テストには付けない');
});

test('区間が壊れていても落ちない（読めなければソロ扱い）', () => {
  const map = stubLS();
  map.set('lak_pair_spans_v1', '{broken');
  assert.equal(pairChecker()(at(10, 0)), false);
});
