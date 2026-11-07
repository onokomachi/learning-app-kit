export const TRIAL_FEATURE_SETS = {
    math: [
        { key: 'practice', label: '練習' },
        { key: 'test', label: '本番テスト' },
        { key: 'stairs', label: '実力の階段' },
        { key: 'boss', label: 'ボス戦' },
    ],
    kokugo: [
        { key: 'read', label: '本文' },
        { key: 'quiz', label: '問題' },
        { key: 'kanji', label: '漢字' },
        { key: 'structure', label: '組み立て（対比）' },
    ],
    eigo: [
        { key: 'a', label: '教材A' },
        { key: 'b', label: '教材B' },
        { key: 'cando', label: 'Can-Do チェック' },
    ],
    sanmon: [
        { key: 'adventure', label: 'ぼうけん' },
        { key: 'speed', label: 'スピードデュエル' },
        { key: 'monster', label: 'モンスター対戦' },
        { key: 'practice', label: '練習' },
        { key: 'review', label: '復習' },
        { key: 'mock_test', label: '本番テスト' },
    ],
    whole: [],
};
const KOKUGO = new Set(['gongitsune', 'hitotsunohana', 'shiroiboushi', 'upandloose', 'kougeihin']);
/** app_id から種類を決める。一覧に無いものは算数（算数の単元アプリはみな同じ4つの画面を持つ） */
export function trialFamilyOf(appId) {
    if (KOKUGO.has(appId))
        return 'kokugo';
    if (appId === 'eigo4')
        return 'eigo';
    if (appId === 'sanmon')
        return 'sanmon';
    if (appId === 'tsunagi')
        return 'whole';
    return 'math';
}
/** 算数アプリの画面（App.tsx の view.kind）→ 項目のキー。HUB・LOG など 項目に入らない画面は null */
export function mathTrialKey(kind) {
    switch (kind) {
        case 'MODULE': return 'practice';
        case 'TEST':
        case 'REFLECT': return 'test';
        case 'TRIAL': return 'stairs';
        case 'BOSS': return 'boss';
        default: return null;
    }
}
//# sourceMappingURL=trialFeatures.js.map