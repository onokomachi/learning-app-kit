/**
 * ソロ／ペア（1台を2人で使っている）の区別。
 *
 * 授業では2人1組で1台のタブレットを使うことが多い。そのとき解いた記録は
 * 持ち主の子の記録として溜まり、その子の正答率が「2人分の力」でふくらむ。
 * 相方の子の記録は残らない。だから**ペアで解いた記録には印を付け、
 * 学力の集計（正答率・層）からは外す**。取り組んだ量には数える。
 *
 * 聞く条件（先生と決めたこと）:
 *   - 学級コードを入れている子だけ。入れていない子（他校・家庭）には一切聞かない
 *   - 平日の 8:40〜15:15（授業の時間）だけ。それ以外は自習とみなし、ソロ扱い
 *   - 1度答えたら45分（1コマ分）覚える。途中で変わったら小さなボタンで切り替える
 *
 * 記録への印は「いつからいつまでペアだったか」の区間から付ける。アプリの記録の形は
 * 変えないので、単元アプリ側のコードは1行も変わらない（kit を上げるだけで入る）。
 * 時刻は端末の時計で判断する（日本の学校の端末なので日本時間になっている前提）。
 */
import { getStudent } from './student.js';
/** 1度答えてから、もう一度聞くまで（1コマ分） */
export const PLAY_MODE_WINDOW_MS = 45 * 60 * 1000;
const CHOICE_KEY = 'lak_play_mode_v1';
const SPANS_KEY = 'lak_pair_spans_v1';
/** ペア区間は長く持ち続けない。送り直し（名乗り直し）に要る期間だけ残す */
const SPAN_KEEP_MS = 120 * 24 * 60 * 60 * 1000;
const SPAN_MAX = 400;
/** 平日の 8:40〜15:15 か */
export function isSchoolTime(d = new Date()) {
    const day = d.getDay();
    if (day === 0 || day === 6)
        return false;
    const m = d.getHours() * 60 + d.getMinutes();
    return m >= 8 * 60 + 40 && m < 15 * 60 + 15;
}
function readChoice() {
    try {
        const raw = localStorage.getItem(CHOICE_KEY);
        if (!raw)
            return null;
        const v = JSON.parse(raw);
        if ((v.mode !== 'solo' && v.mode !== 'duo') || typeof v.until !== 'number')
            return null;
        return { mode: v.mode, at: Number(v.at) || 0, until: v.until };
    }
    catch {
        return null;
    }
}
function readSpans() {
    try {
        const raw = localStorage.getItem(SPANS_KEY);
        const v = raw ? JSON.parse(raw) : [];
        return Array.isArray(v)
            ? v.filter((s) => s && typeof s.from === 'number' && typeof s.to === 'number')
            : [];
    }
    catch {
        return [];
    }
}
function write(key, v) {
    try {
        localStorage.setItem(key, JSON.stringify(v));
    }
    catch { /* 覚えられなくても学習は止めない */ }
}
const listeners = new Set();
export function subscribePlayMode(cb) {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
}
function notify(now) {
    const m = currentPlayMode(now);
    for (const cb of [...listeners]) {
        try {
            cb(m);
        }
        catch { /* noop */ }
    }
}
/** いま有効な選択。まだ聞いていない／45分たった → null */
export function currentPlayMode(now = Date.now()) {
    const c = readChoice();
    return c && now < c.until ? c.mode : null;
}
/**
 * いま聞くべきか。学級コードあり・授業の時間・まだ答えていない（または45分たった）とき。
 */
export function needsPlayModeAsk(now = Date.now()) {
    return getStudent() !== null && isSchoolTime(new Date(now)) && currentPlayMode(now) === null;
}
/**
 * 選ぶ（切り替える）。ここから45分覚える。
 * ペア区間は「選んだ時刻から、切り替えるか45分たつまで」。
 */
export function setPlayMode(mode, now = Date.now()) {
    const until = now + PLAY_MODE_WINDOW_MS;
    // 続いているペア区間は、いまの時刻で閉じる
    let spans = readSpans().map((s) => (s.from <= now && now < s.to ? { from: s.from, to: now } : s));
    if (mode === 'duo')
        spans.push({ from: now, to: until });
    spans = spans.filter((s) => s.to > s.from && s.to > now - SPAN_KEEP_MS).slice(-SPAN_MAX);
    write(SPANS_KEY, spans);
    write(CHOICE_KEY, { mode, at: now, until });
    notify(now);
}
/**
 * 実力を測る場面（本番テスト・神域の試練など）に入るときに呼ぶ。
 * ペアのままなら、ここでソロに切り替える。
 */
export function forceSolo(now = Date.now()) {
    if (currentPlayMode(now) !== 'duo')
        return false;
    setPlayMode('solo', now);
    return true;
}
/** その時刻にペアだったかを判定する関数を返す（区間は1回だけ読む） */
export function pairChecker() {
    const spans = readSpans();
    if (spans.length === 0)
        return () => false;
    return (ts) => spans.some((s) => s.from <= ts && ts < s.to);
}
//# sourceMappingURL=playMode.js.map