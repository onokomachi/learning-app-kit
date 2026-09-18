import { hitotsunohana } from './hitotsunohana.js';
import { gongitsune } from './gongitsune.js';
import { tsunagi } from './tsunagi.js';
import { upandloose } from './upandloose.js';
import { suihei } from './suihei.js';
import { bai } from './bai.js';
import { gaisu } from './gaisu.js';
import { hissan } from './hissan.js';
import { kakudaizu } from './kakudaizu.js';
import { karakuri } from './karakuri.js';
import { kawari } from './kawari.js';
import { suusei } from './suusei.js';
import { syousu } from './syousu.js';
import { COMMON_EXTRA_MODULES, APP_EXTRA_MODULES } from './extras.js';
/**
 * レベル表に無い記号（本番テスト・ボス戦・エラーハンターなど）を足す。
 *
 * module_id が同じものは1つにまとめる。まとめないと、教師の画面に
 * 「エラーハンター」が2つ並ぶ。skill_id が重なったときは先に来たほうを残す。
 */
function withExtras(c) {
    const merged = new Map();
    for (const m of [...COMMON_EXTRA_MODULES, ...(APP_EXTRA_MODULES[c.app_id] ?? [])]) {
        const cur = merged.get(m.module_id);
        if (!cur) {
            merged.set(m.module_id, { ...m, skills: [...m.skills] });
            continue;
        }
        const seen = new Set(cur.skills.map((s) => s.skill_id));
        for (const s of m.skills)
            if (!seen.has(s.skill_id))
                cur.skills.push(s);
    }
    // skill_count はレベル表のぶんだけ。ここでは触らない
    return { ...c, extra_modules: [...merged.values()] };
}
/** app_id → カタログ。新しいアプリはここに足す。 */
export const CATALOGS = Object.fromEntries([hitotsunohana, gongitsune, upandloose, tsunagi, suihei, bai, gaisu, hissan, kakudaizu, karakuri, kawari, suusei, syousu]
    .map(withExtras)
    .map((c) => [c.app_id, c]));
/** 登録済みのアプリ一覧（ダッシュボードの単元セレクタなどに使う） */
export function listApps() {
    return Object.values(CATALOGS).sort((a, b) => a.grade - b.grade || a.subject.localeCompare(b.subject) || a.app_id.localeCompare(b.app_id));
}
/**
 * 記号（app_id + skill_id）を、人が読めるものに戻す。
 * 未登録のアプリや未知の skillId では null を返す
 * ——「知らない記号が来たら黙って捨てる」のではなく、呼び出し側に判断させる。
 */
export function lookupSkill(appId, skillId) {
    const app = CATALOGS[appId];
    if (!app)
        return null;
    const find = (mods, isExtra) => {
        for (const mod of mods) {
            const skill = mod.skills.find((s) => s.skill_id === skillId);
            if (!skill)
                continue;
            return {
                app_id: app.app_id,
                app_title: app.title,
                subject: app.subject,
                grade: app.grade,
                module_id: mod.module_id,
                module_title: mod.title,
                skill_id: skill.skill_id,
                label: skill.label,
                desc: skill.desc,
                answer_kind: skill.answer_kind,
                misconceptions: app.misconceptions.filter((m) => m.skills.includes(skillId)),
                is_extra: isExtra,
            };
        }
        return null;
    };
    // レベル表を先に見る。同じ記号があれば単元の項目として扱う
    return find(app.modules, false) ?? find(app.extra_modules ?? [], true);
}
/** 表示用の短い名前。カタログに無い記号は skillId をそのまま返す（画面が空にならないように）。 */
export function skillLabel(appId, skillId) {
    return lookupSkill(appId, skillId)?.label ?? skillId;
}
/** その誤概念を扱っている skillId の一覧を引く。誤概念別の集計に使う。 */
export function skillsForMisconception(appId, code) {
    return CATALOGS[appId]?.misconceptions.find((m) => m.code === code)?.skills ?? [];
}
/** 教科の一覧（重複なし・登録順）。ダッシュボードの絞り込みに使う。 */
export function listSubjects() {
    return [...new Set(listApps().map((a) => a.subject))];
}
/** 学年の一覧（昇順）。 */
export function listGrades() {
    return [...new Set(listApps().map((a) => a.grade))].sort((a, b) => a - b);
}
//# sourceMappingURL=index.js.map