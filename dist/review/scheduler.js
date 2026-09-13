/**
 * 間隔反復（distributed / spaced practice）のスケジューラ。
 *
 * Dunlosky et al. (2013) が「高い有用性」と判定した2手法のうちの1つ、
 * 「間隔をあけて復習する」を単元アプリに組み込むための純粋関数群。
 * React や保存先には依存しない。状態は呼び出し側（Zustand の progressStore など）が持つ。
 *
 * 方式は Leitner 方式の簡易版:
 *   - 正解（ノーミス完答）するたびに box が 1 つ上がり、次の復習までの間隔が伸びる
 *   - ミスしたら box 0 に戻り、翌日にもう一度出る
 *   - 間隔の既定は 1 → 3 → 7 → 14 → 30 日
 */
export const DAY_MS = 86_400_000;
/** box ごとの「次の復習までの日数」。box は 0 始まりで、この配列の添字。 */
export const DEFAULT_INTERVALS_DAYS = [1, 3, 7, 14, 30];
function intervalMs(box, intervals) {
    const clamped = Math.min(Math.max(box, 0), intervals.length - 1);
    return (intervals[clamped] ?? 1) * DAY_MS;
}
/**
 * 1問（または1レベル）を解き終えたあとの状態を返す。
 * @param prev    そのスキルの直前の状態（初回は undefined）
 * @param correct ノーミスで完答できたか
 */
export function scheduleAfterResult(prev, correct, opts = {}) {
    const intervals = opts.intervalsDays ?? DEFAULT_INTERVALS_DAYS;
    const now = opts.now ?? Date.now();
    const maxBox = intervals.length - 1;
    const box = correct ? Math.min((prev?.box ?? -1) + 1, maxBox) : 0;
    return { box, lastTs: now, nextDueTs: now + intervalMs(box, intervals) };
}
/** 復習の時期が来ているか */
export function isDue(state, now = Date.now()) {
    return !!state && state.nextDueTs <= now;
}
/** 次の復習まであと何日か（負なら期限超過）。日数は切り上げ。 */
export function daysUntilDue(state, now = Date.now()) {
    return Math.ceil((state.nextDueTs - now) / DAY_MS);
}
/**
 * 復習の時期が来ているスキルを、期限超過が大きい順に返す。
 * 「一度も解いていないスキル」は対象外（初回は通常の練習で触れる）。
 */
export function getDueSkills(states, opts = {}) {
    const now = opts.now ?? Date.now();
    const due = [];
    for (const [skillId, st] of Object.entries(states)) {
        if (!st || st.nextDueTs > now)
            continue;
        due.push({ skillId, box: st.box, overdueDays: (now - st.nextDueTs) / DAY_MS });
    }
    due.sort((a, b) => b.overdueDays - a.overdueDays);
    return opts.limit != null ? due.slice(0, opts.limit) : due;
}
/**
 * スケジュールを持っていなかった既存データ（習熟度だけがある）から、初期状態を推定する。
 * localStorage の version 移行（migrate）で使う。
 *
 * 目安: 5連続ノーミス済み → box 2（7日後）／ 正答率70%以上 → box 1（3日後）／ それ以外 → box 0（翌日）
 */
export function inferInitialState(m, lastTs, opts = {}) {
    const intervals = opts.intervalsDays ?? DEFAULT_INTERVALS_DAYS;
    const rate = m.attempts > 0 ? m.corrects / m.attempts : 0;
    const box = (m.perfectStreak ?? 0) >= 5 ? 2 : rate >= 0.7 ? 1 : 0;
    const base = lastTs > 0 ? lastTs : (opts.now ?? Date.now());
    return { box, lastTs: base, nextDueTs: base + intervalMs(box, intervals) };
}
//# sourceMappingURL=scheduler.js.map