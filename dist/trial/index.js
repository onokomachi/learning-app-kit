/**
 * 神域の試練（単元の中の実力チェック）の、画面に依存しない部分。
 *
 * 単元の技能を「層」に並べ、やさしい層から順に登らせて、どこまで確実に
 * できるかを測る。止まった層が、その子がいま取り組むべきところになる。
 *
 *   極限 … 各層2問。2問正解で突破、同じ層で2回まちがえたら止まる。
 *          2層続けてノーミスなら1層飛ばす（最後の層は必ず解かせる）。
 *   無限 … 神座（全層突破）に1度たどりついた子だけ。3回まちがえるまで続く。
 *
 * 「一度の成功でその子の実力と決めない」ために、到達と刻印を分ける。
 *   今の層 … いちばん新しい極限の結果。下がることもある
 *   刻印   … ソロで最後までやった極限のうち、その層以上に届いた回が通算3回あれば付く
 *
 * 結果は端末に保存し（自己ベストの表示用）、学級コードがあればサーバにも送る。
 * アプリの学習ログ（logs）には入れない——入れると熟達度や連続記録が動き、
 * 学習のきろく画面がテストの答案として表示しようとする。
 */
import { getDeviceKey } from '../sync/device.js';
import { getStudent } from '../sync/student.js';
export const QUESTIONS_PER_FLOOR = 2;
export const MISSES_TO_STOP = 2;
export const ENDLESS_MISSES = 3;
/** 刻印に必要な回数（通算） */
export const SEAL_COUNT = 3;
export function startClimb(floors) {
    return { floors, at: 0, correct: 0, misses: 0, perfectRun: 0, cleared: 0, skipped: [], done: false, history: [] };
}
export function answerClimb(s, skillId, correct) {
    if (s.done)
        return s;
    const history = [...s.history, { floor: s.at, skillId, correct }];
    if (!correct) {
        const misses = s.misses + 1;
        return { ...s, history, misses, perfectRun: 0, done: misses >= MISSES_TO_STOP };
    }
    const got = s.correct + 1;
    if (got < QUESTIONS_PER_FLOOR)
        return { ...s, history, correct: got };
    // この層を突破
    const perfect = s.misses === 0 ? s.perfectRun + 1 : 0;
    let next = s.at + 1;
    const skipped = [...s.skipped];
    let perfectRun = perfect;
    // 2層続けてノーミスなら1層飛ばす。ただし最後の層は飛ばさない（神座は必ず解いて届く）
    if (perfect >= 2 && next + 1 <= s.floors - 1) {
        skipped.push(next);
        next += 1;
        perfectRun = 0;
    }
    if (next >= s.floors) {
        return { ...s, history, correct: 0, misses: 0, perfectRun, cleared: s.floors, skipped, done: true };
    }
    return { ...s, history, at: next, correct: 0, misses: 0, perfectRun, cleared: next, skipped };
}
/** 次に出す問題の記号。同じ層で同じ記号が続かないようにする */
export function pickClimbSkill(s, defs, rand = Math.random) {
    const pool = defs[s.at]?.skills ?? [];
    const last = s.history[s.history.length - 1];
    const choices = pool.length > 1 && last && last.floor === s.at ? pool.filter((k) => k !== last.skillId) : pool;
    const list = choices.length > 0 ? choices : pool;
    return list[Math.floor(rand() * list.length)] ?? pool[0] ?? '';
}
export function startEndless() {
    return { score: 0, misses: 0, done: false, history: [] };
}
export function answerEndless(s, floor, skillId, correct) {
    if (s.done)
        return s;
    const history = [...s.history, { floor, skillId, correct }];
    if (correct)
        return { ...s, history, score: s.score + 1 };
    const misses = s.misses + 1;
    return { ...s, history, misses, done: misses >= ENDLESS_MISSES };
}
/**
 * 無限の出題。進むほど上の層に寄せる（3問正解ごとに、出る層の下限が1つ上がる）。
 */
export function pickEndless(s, defs, rand = Math.random) {
    const top = defs.length - 1;
    const low = Math.min(top, Math.floor(s.score / 3));
    const floor = low + Math.floor(rand() * (top - low + 1));
    const pool = defs[floor]?.skills ?? [];
    return { floor, skillId: pool[Math.floor(rand() * pool.length)] ?? pool[0] ?? '' };
}
export function summarize(records, floors) {
    const climbs = records.filter((r) => r.mode === '極限').sort((a, b) => a.ts - b.ts);
    const countable = climbs.filter((r) => r.soloComplete);
    const reachedAtLeast = (k) => countable.filter((r) => r.floor >= k).length;
    let sealed = 0;
    for (let k = floors; k >= 1; k--) {
        if (reachedAtLeast(k) >= SEAL_COUNT) {
            sealed = k;
            break;
        }
    }
    const best = climbs.reduce((m, r) => Math.max(m, r.floor), 0);
    // 刻印の次の目標は「刻印より上で、いちばん高く届いた層」。まだ届いていなければ刻印の1つ上
    const target = Math.max(best, sealed + 1);
    const nextSeal = sealed >= floors ? null
        : { floor: Math.min(target, floors), count: reachedAtLeast(Math.min(target, floors)) };
    const endless = records.filter((r) => r.mode === '無限');
    return {
        current: climbs.length ? climbs[climbs.length - 1].floor : null,
        best,
        sealed,
        nextSeal: nextSeal && nextSeal.floor > sealed ? nextSeal : null,
        endlessUnlocked: best >= floors,
        endlessBest: endless.reduce((m, r) => Math.max(m, r.score), 0),
        runs: climbs.length,
    };
}
export function predictScore(items, cleared) {
    return items.reduce((s, it) => s + (cleared >= it.floor ? it.points : 0), 0);
}
/** いまより上で、点が上がる最初の層と、上がる点数 */
export function nextGain(items, cleared, floors) {
    const now = predictScore(items, cleared);
    for (let f = cleared + 1; f <= floors; f++) {
        const p = predictScore(items, f);
        if (p > now)
            return { floor: f, gain: p - now };
    }
    return null;
}
/* ------------------------------------------------------------------ */
/* 端末への保存とサーバへの送信                                         */
/* ------------------------------------------------------------------ */
const keyOf = (appId) => `lak_trial_v1_${appId}`;
const MAX_KEEP = 300;
export function loadTrials(appId) {
    try {
        const raw = localStorage.getItem(keyOf(appId));
        const v = raw ? JSON.parse(raw) : [];
        return Array.isArray(v) ? v.filter((r) => r && typeof r.eventId === 'string' && typeof r.floor === 'number') : [];
    }
    catch {
        return [];
    }
}
function saveAll(appId, rows) {
    try {
        localStorage.setItem(keyOf(appId), JSON.stringify(rows.sort((a, b) => a.ts - b.ts).slice(-MAX_KEEP)));
    }
    catch { /* 保存できなくても試練は続けられる */ }
}
/** サーバの記録を足し合わせる（端末のデータが消えたときの復元）。同じ回は1つにまとめる */
export function mergeTrials(local, remote) {
    const byId = new Map();
    for (const r of remote)
        byId.set(r.eventId, { ...r, sent: true });
    for (const r of local)
        byId.set(r.eventId, { ...byId.get(r.eventId), ...r, sent: r.sent || byId.has(r.eventId) });
    return [...byId.values()].sort((a, b) => a.ts - b.ts);
}
function headers(key) {
    return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}
/** まだ送っていない記録をサーバへ送る。失敗しても何も壊さない（次の機会に送る） */
export async function flushTrials(config) {
    const { appId, supabaseUrl, supabaseKey } = config;
    if (!supabaseUrl || !supabaseKey)
        return 0;
    const all = loadTrials(appId);
    const unsent = all.filter((r) => !r.sent);
    if (unsent.length === 0)
        return 0;
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/sync_events`, {
            method: 'POST',
            headers: headers(supabaseKey),
            body: JSON.stringify({
                p_device_key: getDeviceKey(),
                p_app_id: appId,
                p_student_id: getStudent()?.studentId ?? null,
                p_events: unsent.map((r) => ({
                    event_id: r.eventId,
                    skill_id: r.mode === '極限' ? 'trial-kyokugen' : 'trial-mugen',
                    module_id: 'trial',
                    label: r.mode === '極限' ? `神域の試練・極限 ${r.floor}/${r.floors}層` : `神域の試練・無限 ${r.score}`,
                    correct: r.floor >= r.floors,
                    ts: r.ts,
                    detail: {
                        kind: 'trial', mode: r.mode, floor: r.floor, floors: r.floors,
                        score: r.score, soloComplete: r.soloComplete,
                    },
                })),
            }),
        });
        if (!res.ok)
            return 0;
        const sentIds = new Set(unsent.map((r) => r.eventId));
        saveAll(appId, loadTrials(appId).map((r) => (sentIds.has(r.eventId) ? { ...r, sent: true } : r)));
        return unsent.length;
    }
    catch {
        return 0;
    }
}
/** 1回分を保存して、送れるなら送る */
export async function saveTrial(config, rec) {
    const row = {
        ...rec,
        ts: rec.ts ?? Date.now(),
        eventId: `trial-${(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)}`.slice(0, 64),
        sent: false,
    };
    saveAll(config.appId, [...loadTrials(config.appId), row]);
    await flushTrials(config);
    return row;
}
/**
 * サーバから自分の記録を取り戻して、端末の記録と合わせる。
 * 学級コードを入れていない子（studentId が無い）は端末の記録だけを返す。
 */
export async function syncTrialsFromServer(config) {
    const local = loadTrials(config.appId);
    const student = getStudent();
    const { supabaseUrl, supabaseKey } = config;
    if (!student || !supabaseUrl || !supabaseKey)
        return local;
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/my_trial_results`, {
            method: 'POST',
            headers: headers(supabaseKey),
            body: JSON.stringify({ p_student_id: student.studentId, p_app_id: config.appId }),
        });
        if (!res.ok)
            return local;
        const rows = (await res.json());
        const remote = rows.map((r) => ({
            eventId: r.event_id, ts: Number(r.ts), mode: r.mode, floor: r.floor, floors: r.floors,
            score: r.score, soloComplete: r.solo_complete, sent: true,
        }));
        const merged = mergeTrials(local, remote);
        saveAll(config.appId, merged);
        return merged;
    }
    catch {
        return local;
    }
}
/* ------------------------------------------------------------------ */
/* 本番テストから 層を組む                                              */
/* ------------------------------------------------------------------ */
/** 層の見出し（第Ⅰ層…）。層の数が10を超えることは想定しない */
export const NUMERALS = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];
/** 突破した層の数 → 子どもの画面の名前。0 は「第Ⅰ層に挑戦中」、全層なら神座 */
export function floorName(cleared, floors) {
    if (cleared >= floors)
        return '神座';
    if (cleared <= 0)
        return '第Ⅰ層に挑戦中';
    return `第${NUMERALS[cleared - 1] ?? cleared}層`;
}
/** 見出しから（…）の補足を落として短くする */
const shortTitle = (t) => t.replace(/[（(][^）)]*[）)]\s*$/, '').trim() || t;
/**
 * アプリの本番テストの設問から、神域の試練の層を組む。
 *
 * **層の順は本番テストの設問の順**（表の大問1 → … → 裏）。本番テストは
 * 基本から応用へ並んでいるので、そのまま「やさしい層から」になる。
 * 同じモジュール（記号の前半）が続く項目は1つの層にまとめ（3つまで）、
 * それでも maxFloors を超えるときは、項目の少ない となり同士を まとめる。
 *
 * これは**仮の組み方**。実際の紙のテストに合わせて並べ直すときは、
 * アプリ側で floors と reqs を手で書けばよい（倍の見方がその形）。
 */
export function floorsFromTestSteps(steps, opts = {}) {
    const maxFloors = opts.maxFloors ?? 8;
    const scored = steps.filter((s) => s.points > 0);
    const order = [];
    for (const s of scored)
        if (!order.includes(s.skillId))
            order.push(s.skillId);
    let groups = [];
    for (const sk of order) {
        const last = groups[groups.length - 1];
        const prefix = sk.split('-')[0];
        if (last && last.length < 3 && last[0].split('-')[0] === prefix)
            last.push(sk);
        else
            groups.push([sk]);
    }
    while (groups.length > maxFloors) {
        let at = 0;
        for (let i = 1; i < groups.length - 1; i++) {
            if (groups[i].length + groups[i + 1].length < groups[at].length + groups[at + 1].length)
                at = i;
        }
        groups = [...groups.slice(0, at), [...groups[at], ...groups[at + 1]], ...groups.slice(at + 2)];
    }
    const titleOf = (sk) => shortTitle(scored.find((s) => s.skillId === sk)?.title ?? sk);
    const floors = groups.map((g) => {
        const titles = [...new Set(g.map(titleOf))];
        return { label: titles.slice(0, 2).join('・') + (titles.length > 2 ? ' ほか' : ''), skills: g };
    });
    const floorOf = new Map();
    groups.forEach((g, i) => g.forEach((sk) => floorOf.set(sk, i + 1)));
    const reqs = scored.map((s) => ({ points: s.points, floor: floorOf.get(s.skillId) ?? floors.length }));
    return { floors, reqs, max: reqs.reduce((a, r) => a + r.points, 0) };
}
//# sourceMappingURL=index.js.map