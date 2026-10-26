/**
 * SANMON:04（小4算数のゲーム）と学級ポータルをつなぐ「きまり」。
 *
 * 子ども用ハブ（町の解放メーターとスタミナを見せる）と SANMON（町に入れるか・バトルでスタミナを使う）が
 * 同じきまりで判定するよう、ここ1か所に置く。どちらかだけ直すと、ハブでは「開いた」のに SANMON では入れない、が起きる。
 *
 * きまり（2026-10 先生と決めたこと）:
 * - 町（単元）を開けるには、その単元アプリで 4つ を **すべて** 満たす。誰かに1回だけクリアしてもらう、運でクリア、を防ぐため。
 *     練習  … 練習の項目の7割を「できた」（5回連続ノーミス）にする
 *     テスト … 本番テストで8割以上を取った日が、**ちがう日に3日**（ペアの時間は数えない）。
 *              「ぜんぶ」で8割、または同じ日に「表」と「裏」の両方で8割なら、その日を1日と数える（数えるのはサーバの sanmon_status）。
 *              同じ日に何回合格しても1日。
 *     階段  … 実力の階段を、ひとりで 半分の段 まで登る
 *     ねばり … その単元を ひとりで **3日以上** 練習する
 * - アプリが無い単元（大きい数・折れ線グラフと表・角の大きさ）は はじめから開いている。
 * - スタミナは各単元アプリの正解1問で1たまる（1つの項目で1日5まで・熟達した項目は半分・ためておけるのは100まで・ペアの時間は半分。
 *   2026-10-25〜 サーバの _sanmon_stamina が決める。dailyCap はもう使っていない）。
 *   SANMON のバトル1回で5使う。SANMON の練習・復習・本番テストはスタミナなしで使える。
 *   計算はサーバ（sanmon_status / sanmon_spend）がする。端末の数字を書きかえても増えない。
 */
import { CATALOGS } from '../catalog/index.js';
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
};
/** SANMON の町（はじめ14、2026-10 に 垂直・平行と四角形 を足して15）。並びは SANMON の学習順（MATH_CATEGORIES）と同じ */
export const SANMON_UNITS = [
    { key: 'bignum', name: '大きい数のしくみ' },
    { key: 'graph', name: '折れ線グラフと表' },
    { key: 'div1', name: 'わり算の筆算(÷1けた)', appId: 'hissan' },
    { key: 'angle', name: '角の大きさ' },
    // 2026-10 に足した町（ヘイコウ台地）。SANMON の問題は このアプリと同じ画面で出す
    { key: 'suihei', name: '垂直・平行と四角形', appId: 'suihei' },
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
const meter = (have, need) => ({ have, need, done: have >= need });
function skillsOf(c, modules) {
    return c.modules.filter((m) => !modules || modules.includes(m.module_id)).flatMap((m) => m.skills.map((s) => s.skill_id));
}
/** 町ごとの「あと どれだけ」。判定はこの関数だけでする */
export function sanmonUnits(status, catalogs = CATALOGS) {
    return SANMON_UNITS.map((u) => {
        if (!u.appId)
            return { key: u.key, name: u.name, always: true, open: true };
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
const TRIAL_FLOORS = { bai: 7, karakuri: 8, suihei: 8 };
function trialFloors(appId) { return TRIAL_FLOORS[appId] ?? 8; }
/* ------------------------------------------------------------------ */
/* モンスターの育て方：かけら と レベルの上限                           */
/* ------------------------------------------------------------------ */
/**
 * 単元の「かけら」とレベルの上限の数え方（2026-10 先生と決めた）。
 *
 * モンスターのレベルの上限は、その単元のかけらでしか上がらない。かけらは単元アプリでの成果でもらう
 * （本番テストで8割の日・実力の階段で高い段まで）。アプリが無い単元は SANMON の練習（5回連続ノーミスの項目）でもらう。
 * 上限まで育てるには SANMON で そのモンスターの問題を解く。だから「アプリでがんばる」と「SANMON で練習する」の両方に理由ができる。
 * かけらで直接強くはしない（強さがふくらみすぎて、すぐにバランスが崩れるため）。
 */
export const SANMON_GROWTH = {
    /** かけらが0のときの上限 */
    baseCap: 20,
    /** かけら1つで上がる上限 */
    capPerShard: 5,
    maxCap: 60,
    /** 本番テストで8割の日は、5日ぶんまで数える */
    testShardsMax: 5,
    /** 実力の階段：この割合の段まで登るごとに1つ（半分・4分の3・てっぺん） */
    trialMilestones: [0.5, 0.75, 1],
    /** アプリが無い単元：SANMON の練習で、この数ぶんに分けてもらう */
    practiceShardsMax: 8,
};
/** かけらの数 → レベルの上限 */
export function levelCapFor(shards) {
    return Math.min(SANMON_GROWTH.maxCap, SANMON_GROWTH.baseCap + SANMON_GROWTH.capPerShard * Math.max(0, Math.floor(shards)));
}
/** 単元ごとの かけら と レベルの上限。サーバの記録（sanmon_status）から決めるので、端末を変えても同じ */
export function sanmonShards(status, catalogs = CATALOGS) {
    const sanmonMastered = new Set(status?.apps[SANMON_APP_ID]?.mastered ?? []);
    const sanmonCatalog = catalogs[SANMON_APP_ID];
    return SANMON_UNITS.map((u) => {
        let test = 0;
        let trial = 0;
        let practice = 0;
        if (u.appId) {
            const rec = status?.apps[u.appId];
            test = Math.min(SANMON_GROWTH.testShardsMax, rec?.tests[u.testSkill ?? 'mock-test'] ?? 0);
            trial = SANMON_GROWTH.trialMilestones.filter((m) => (rec?.trial ?? 0) + 1e-9 >= m).length;
        }
        else {
            const skills = sanmonCatalog ? skillsOf(sanmonCatalog, [u.key]) : [];
            const done = skills.filter((s) => sanmonMastered.has(s)).length;
            practice = skills.length ? Math.floor((SANMON_GROWTH.practiceShardsMax * done) / skills.length) : 0;
        }
        const shards = test + trial + practice;
        return { key: u.key, name: u.name, shards, cap: levelCapFor(shards), from: { test, trial, practice } };
    });
}
/** 開いている町の記号（SANMON の UNIT_KEYS）の集合 */
export function openUnitKeys(units) {
    return new Set(units.filter((u) => u.open).map((u) => u.key));
}
async function rpc(config, fn, body) {
    const { supabaseUrl, supabaseKey } = config;
    if (!supabaseUrl || !supabaseKey)
        return { ok: false, message: 'がっきゅうポータルに つながっていません' };
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
            method: 'POST',
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok)
            return { ok: false, message: `よみこめませんでした (${res.status})` };
        return { ok: true, data: (await res.json()) };
    }
    catch {
        return { ok: false, message: 'ネットに つながっていないようです' };
    }
}
/** スタミナと、町を開ける判定に使う記録を読む */
export async function fetchSanmonStatus(config, studentId) {
    const r = await rpc(config, 'sanmon_status', { p_student_id: studentId });
    if (!r.ok)
        return r;
    const d = r.data;
    return { ok: true, status: { stamina: d.stamina ?? 0, earnedToday: d.earned_today ?? 0, apps: d.apps ?? {} } };
}
/**
 * スタミナを使う。足りなければ ok=false（使わない）。
 * eventId はバトルごとに1つ。同じ eventId で送り直しても二重に減らない。
 */
export async function spendStamina(config, studentId, eventId, amount = SANMON_RULES.battleCost, reason = '') {
    const r = await rpc(config, 'sanmon_spend', { p_student_id: studentId, p_event_id: eventId, p_amount: amount, p_reason: reason });
    if (!r.ok)
        return { ok: false, stamina: null, message: r.message };
    return r.data.ok
        ? { ok: true, stamina: r.data.stamina }
        : { ok: false, stamina: r.data.stamina, message: 'スタミナが たりないよ' };
}
/** SANMON のセーブデータ（端末をまたいで続きから遊ぶ） */
export async function loadSanmonSave(config, studentId) {
    const r = await rpc(config, 'sanmon_save_get', { p_student_id: studentId });
    return r.ok ? { ok: true, data: r.data } : r;
}
export async function saveSanmonSave(config, studentId, data) {
    const r = await rpc(config, 'sanmon_save_put', { p_student_id: studentId, p_data: data });
    return r.ok;
}
/* ------------------------------------------------------------------ */
/* モードの開け閉め（先生が PRISM の SANMON タブで、学級ごとに決める）     */
/* ------------------------------------------------------------------ */
/**
 * 先生が開け閉めできる SANMON のモード。サーバの表 sanmon_mode_settings の modes のキー。
 * 「きろく」は いつも開いている（自分の記録を見るだけなので）。
 */
export const SANMON_MODES = [
    { key: 'adventure', label: 'ぼうけん', desc: '3Dの町を歩いて、モンスターと算数バトル' },
    { key: 'speed', label: 'スピードデュエル', desc: 'コンピュータと早押し' },
    { key: 'monster', label: 'モンスター対戦（コンピュータ）', desc: 'つかまえたモンスターのパーティ（3匹か5匹）で、コンピュータと対戦' },
    { key: 'class_duel', label: 'クラス対戦', desc: '同じ学級の友だちと、モンスターのパーティで対戦' },
    { key: 'practice', label: '練習', desc: '分野をえらんで問題をとく' },
    { key: 'review', label: '復習', desc: 'まちがえた問題を ちょうどよいころに' },
    { key: 'mock_test', label: '本番テスト', desc: '学校のテストの形で' },
];
/** 平日モードで閉じられるモード（ゲームだけ。練習・復習・本番テストは学習なので閉じない） */
export const SCHOOL_HOURS_MODES = ['adventure', 'speed', 'monster', 'class_duel'];
/** 平日モードの はじめの値 */
export const SCHOOL_HOURS_DEFAULT = { start: '08:00', end: '15:30', modes: [...SCHOOL_HOURS_MODES] };
export function isModeOpen(modes, key) {
    return modes?.[key] !== false;
}
/** そのモードが平日モード（授業の時間）で閉じているか */
export function isSchoolHoursLocked(modes, key) {
    const sh = modes?._school_hours;
    return !!sh?.enabled && !!sh.active && sh.modes.includes(key);
}
/**
 * 閉じているモードを押したときに子どもに出す文。開いていれば null。
 * 授業の時間で閉じているときは「いつ開くか」と「いまできること」を出す（ただ閉じるより、こわれたと思われない）。
 */
export function modeLockMessage(modes, key) {
    if (isModeOpen(modes, key))
        return null;
    if (isSchoolHoursLocked(modes, key)) {
        return `いまは じゅぎょうの じかん。${modes._school_hours.end}から あそべるよ（れんしゅう・ふくしゅう・テストは できるよ）`;
    }
    return '先生が まだ ひらいていないよ';
}
/** 平日モードの時間か（端末の時計。通信が切れたときだけ使う。祝日は分からないので 月〜金 で見る） */
export function inSchoolHoursLocal(sh, now = new Date()) {
    const jst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
    const day = jst.getDay();
    if (day === 0 || day === 6)
        return false;
    const hm = `${String(jst.getHours()).padStart(2, '0')}:${String(jst.getMinutes()).padStart(2, '0')}`;
    return hm >= sh.start && hm < sh.end;
}
/** 通信が切れたとき：前に読めた平日モードの設定から、いまの開け閉めを作る */
export function offlineModes(cached, now = new Date()) {
    const sh = cached._school_hours;
    if (!sh?.enabled)
        return cached;
    const openUntil = sh.open_until ? Date.parse(sh.open_until) : NaN;
    const active = inSchoolHoursLocal(sh, now) && !(openUntil > now.getTime());
    const out = { ...(sh.base ?? {}) };
    if (active)
        for (const k of sh.modes)
            out[k] = false;
    out._school_hours = { ...sh, active };
    return out;
}
const MODES_CACHE_KEY = 'lak_sanmon_modes_v1';
/**
 * 自分の学級のモードの開け閉めを読む。
 * 読めたら端末に覚えておく。読めないときは、前に読めた設定で平日モードだけは効かせる（通信を切って抜けられないように）。
 * 一度も読めていなければ すべて開いている扱い（ok: false）。
 */
export async function fetchSanmonModes(config, studentId) {
    const r = await rpc(config, 'sanmon_modes', { p_student_id: studentId });
    if (r.ok) {
        const modes = r.data ?? {};
        try {
            localStorage.setItem(MODES_CACHE_KEY, JSON.stringify({ studentId, modes }));
        }
        catch { /* 覚えられなくても動く */ }
        return { ok: true, modes };
    }
    try {
        const c = JSON.parse(localStorage.getItem(MODES_CACHE_KEY) ?? 'null');
        if (c?.studentId === studentId && c.modes._school_hours?.enabled)
            return { ok: true, modes: offlineModes(c.modes), offline: true };
    }
    catch { /* 読めなければ下へ */ }
    return r;
}
/**
 * 平日モードで閉じているモードを押したことをサーバに残す（先生の PRISM に「押した回数」として出る。ばつではなく声かけのため）。
 * サーバは、本当に平日モードで閉じているときだけ・同じモードは3分に1回だけ残す。失敗しても何もしない。
 */
export async function reportLockHit(config, studentId, key) {
    await rpc(config, 'sanmon_lock_hit', { p_student_id: studentId, p_mode: key });
}
//# sourceMappingURL=index.js.map