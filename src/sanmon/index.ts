/**
 * SANMON:04（小4算数のゲーム）と学級ポータルをつなぐ「きまり」。
 *
 * 子ども用ハブ（町の解放メーターとスタミナを見せる）と SANMON（町に入れるか・バトルでスタミナを使う）が
 * 同じきまりで判定するよう、ここ1か所に置く。どちらかだけ直すと、ハブでは「開いた」のに SANMON では入れない、が起きる。
 *
 * きまり（2026-10 先生と決めたこと）:
 * - 町（単元）を開けるには、その単元アプリで 4つ を **すべて** 満たす。誰かに1回だけクリアしてもらう、運でクリア、を防ぐため。
 *     練習  … 練習の項目の7割を「できた」（5回連続ノーミス）にする
 *     テスト … 本番テスト（表と裏のぜんぶ）で8割以上を、**ちがう日に3回**（ペアの時間は数えない）
 *     階段  … 実力の階段を、ひとりで 半分の段 まで登る
 *     ねばり … その単元を ひとりで **3日以上** 練習する
 * - アプリが無い単元（大きい数・折れ線グラフと表・角の大きさ）は はじめから開いている。
 * - スタミナは各単元アプリの正解1問で1たまる（1日30まで・ためておけるのは100まで・ペアの時間は半分）。
 *   SANMON のバトル1回で5使う。SANMON の練習・復習・本番テストはスタミナなしで使える。
 *   計算はサーバ（sanmon_status / sanmon_spend）がする。端末の数字を書きかえても増えない。
 */
import { CATALOGS, type AppCatalog } from '../catalog/index.js';
import type { ResolveConfig } from '../sync/student.js';

export const SANMON_APP_ID = 'sanmon';

export const SANMON_RULES = {
  practiceRatio: 0.7,
  testRatio: 0.8,
  testPassDays: 3,
  trialRatio: 0.5,
  soloDays: 3,
  battleCost: 5,
  dailyCap: 30,
  maxStamina: 100,
} as const;

export interface SanmonUnitRule {
  /** SANMON の UNIT_KEYS と同じ記号 */
  key: string;
  /** SANMON の単元名（MATH_CATEGORIES の name） */
  name: string;
  /** その単元の学級ポータルのアプリ。無ければ はじめから開いている */
  appId?: string;
  /** 練習の数に入れるカタログのモジュール（省略＝アプリのすべて） */
  modules?: string[];
  /** 本番テストの記録の skill_id（省略＝'mock-test'） */
  testSkill?: string;
}

/** SANMON の14の町。並びは SANMON の学習順（MATH_CATEGORIES）と同じ */
export const SANMON_UNITS: SanmonUnitRule[] = [
  { key: 'bignum', name: '大きい数のしくみ' },
  { key: 'graph', name: '折れ線グラフと表' },
  { key: 'div1', name: 'わり算の筆算(÷1けた)', appId: 'hissan' },
  { key: 'angle', name: '角の大きさ' },
  { key: 'decimal', name: '小数のしくみ', appId: 'syousu', modules: ['place-value', 'number-line', 'decimal-addsub'] },
  { key: 'div2', name: 'わり算の筆算(÷2けた)', appId: 'hissan' },
  { key: 'rounding', name: 'がい数', appId: 'gaisu' },
  { key: 'calcrules', name: '計算のきまり', appId: 'karakuri' },
  { key: 'area', name: '面積', appId: 'menseki4' },
  { key: 'decmuldiv', name: '小数のかけ算とわり算', appId: 'syousu', modules: ['decimal-muldiv'], testSkill: 'mock-test-muldiv' },
  { key: 'fraction', name: '分数', appId: 'bunsuu4' },
  { key: 'change', name: '変わり方調べ', appId: 'kawari' },
  { key: 'solid', name: '直方体と立方体', appId: 'rippoutai' },
  { key: 'ratio', name: '倍の見方', appId: 'bai' },
];

/** サーバ（sanmon_status）が返す、アプリごとの記録 */
export interface SanmonAppRecord {
  mastered: string[];
  /** テストの skill_id → 8割以上を取った日数 */
  tests: Record<string, number>;
  /** ひとりで登った いちばん高い段の割合（0〜1） */
  trial: number;
  solo_days: number;
}

export interface SanmonStatus {
  stamina: number;
  earnedToday: number;
  apps: Record<string, SanmonAppRecord>;
}

export interface Meter { have: number; need: number; done: boolean }

export interface SanmonUnitProgress {
  key: string;
  name: string;
  appId?: string;
  appTitle?: string;
  appUrl?: string;
  /** アプリが無いので はじめから開いている */
  always: boolean;
  open: boolean;
  practice?: Meter;
  test?: Meter;
  /** 段の数で表す（例: 8段の階段なら need=4） */
  trial?: Meter;
  days?: Meter;
}

const meter = (have: number, need: number): Meter => ({ have, need, done: have >= need });

function skillsOf(c: AppCatalog, modules?: string[]): string[] {
  return c.modules.filter((m) => !modules || modules.includes(m.module_id)).flatMap((m) => m.skills.map((s) => s.skill_id));
}

/** 町ごとの「あと どれだけ」。判定はこの関数だけでする */
export function sanmonUnits(status: SanmonStatus | null, catalogs: Record<string, AppCatalog> = CATALOGS): SanmonUnitProgress[] {
  return SANMON_UNITS.map((u) => {
    if (!u.appId) return { key: u.key, name: u.name, always: true, open: true };
    const c = catalogs[u.appId];
    const rec = status?.apps[u.appId];
    const skills = c ? skillsOf(c, u.modules) : [];
    const mastered = new Set(rec?.mastered ?? []);
    const practice = meter(skills.filter((s) => mastered.has(s)).length, Math.max(1, Math.ceil(skills.length * SANMON_RULES.practiceRatio)));
    const test = meter(rec?.tests[u.testSkill ?? 'mock-test'] ?? 0, SANMON_RULES.testPassDays);
    const floors = trialFloors(u.appId);
    const trial = meter(Math.floor((rec?.trial ?? 0) * floors + 1e-9), Math.ceil(floors * SANMON_RULES.trialRatio));
    const days = meter(rec?.solo_days ?? 0, SANMON_RULES.soloDays);
    return {
      key: u.key, name: u.name, appId: u.appId, appTitle: c?.title, appUrl: c?.url,
      always: false, open: practice.done && test.done && trial.done && days.done,
      practice, test, trial, days,
    };
  });
}

/**
 * 実力の階段の段の数（記録の floors と同じ）。メーターを「段」で見せるためだけに使う。
 * サーバは割合で返すので、ここが実物とずれても判定（半分以上）は変わらない。
 */
const TRIAL_FLOORS: Record<string, number> = { bai: 7, karakuri: 8, suihei: 8 };
function trialFloors(appId: string): number { return TRIAL_FLOORS[appId] ?? 8; }

/** 開いている町の記号（SANMON の UNIT_KEYS）の集合 */
export function openUnitKeys(units: readonly SanmonUnitProgress[]): Set<string> {
  return new Set(units.filter((u) => u.open).map((u) => u.key));
}

async function rpc<T>(config: ResolveConfig, fn: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const { supabaseUrl, supabaseKey } = config;
  if (!supabaseUrl || !supabaseKey) return { ok: false, message: 'がっきゅうポータルに つながっていません' };
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, message: `よみこめませんでした (${res.status})` };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, message: 'ネットに つながっていないようです' };
  }
}

/** スタミナと、町を開ける判定に使う記録を読む */
export async function fetchSanmonStatus(config: ResolveConfig, studentId: string) {
  const r = await rpc<{ stamina: number; earned_today: number; apps: Record<string, SanmonAppRecord> }>(config, 'sanmon_status', { p_student_id: studentId });
  if (!r.ok) return r;
  const d = r.data;
  return { ok: true as const, status: { stamina: d.stamina ?? 0, earnedToday: d.earned_today ?? 0, apps: d.apps ?? {} } satisfies SanmonStatus };
}

/**
 * スタミナを使う。足りなければ ok=false（使わない）。
 * eventId はバトルごとに1つ。同じ eventId で送り直しても二重に減らない。
 */
export async function spendStamina(config: ResolveConfig, studentId: string, eventId: string, amount: number = SANMON_RULES.battleCost, reason = '') {
  const r = await rpc<{ ok: boolean; stamina: number }>(config, 'sanmon_spend', { p_student_id: studentId, p_event_id: eventId, p_amount: amount, p_reason: reason });
  if (!r.ok) return { ok: false as const, stamina: null, message: r.message };
  return r.data.ok
    ? { ok: true as const, stamina: r.data.stamina }
    : { ok: false as const, stamina: r.data.stamina, message: 'スタミナが たりないよ' };
}

/** SANMON のセーブデータ（端末をまたいで続きから遊ぶ） */
export async function loadSanmonSave(config: ResolveConfig, studentId: string) {
  const r = await rpc<Record<string, unknown> | null>(config, 'sanmon_save_get', { p_student_id: studentId });
  return r.ok ? { ok: true as const, data: r.data } : r;
}

export async function saveSanmonSave(config: ResolveConfig, studentId: string, data: Record<string, unknown>) {
  const r = await rpc<boolean>(config, 'sanmon_save_put', { p_student_id: studentId, p_data: data });
  return r.ok;
}
