import { suihei } from './suihei.js';
/** app_id → カタログ。新しいアプリはここに足す。 */
export const CATALOGS = {
    [suihei.app_id]: suihei,
};
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
    for (const mod of app.modules) {
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
        };
    }
    return null;
}
/** 表示用の短い名前。カタログに無い記号は skillId をそのまま返す（画面が空にならないように）。 */
export function skillLabel(appId, skillId) {
    return lookupSkill(appId, skillId)?.label ?? skillId;
}
/** その誤概念を扱っている skillId の一覧を引く。誤概念別の集計に使う。 */
export function skillsForMisconception(appId, code) {
    return CATALOGS[appId]?.misconceptions.find((m) => m.code === code)?.skills ?? [];
}
//# sourceMappingURL=index.js.map