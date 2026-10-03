/**
 * おまかせモード（適応難易度）の決まり。React に依存しない純粋関数だけを置く。
 *
 * - 始めるレベル: 前から順に、習熟度 0.7 以上のレベルを飛ばす（とちゅうで足りないレベルがあればそこから）
 * - とちゅう: 2問続けてノーミスで1つ上へ、2問続けてミスで1つ下へ
 *
 * **習熟度は「記録に残した skillId」で引く。** レベルの ID と記録の skillId が同じアプリが多いが、
 * 「レベルは '2-1'、記録は 'hissan-2-1'」のようにちがうモジュールもある。
 * そのときは toSkillId で記録の名前に直して渡す。以前は全アプリが prefix を必ず足していたため、
 * ID がすでに 'compare-basic' のアプリでは 'compare-compare-basic' を引いてしまい、
 * 開始レベルがいつも最初になっていた。
 */
export function recommendStart(getMastery, levelIds, toSkillId = (id) => id) {
    let start = 0;
    for (let i = 0; i < levelIds.length - 1; i++) {
        if (getMastery(toSkillId(levelIds[i])) >= 0.7)
            start = i + 1;
        else
            break;
    }
    return start;
}
/** 1問の結果から、次のレベルの位置を決める */
export function nextAdaptiveIndex(s, perfect, total) {
    if (perfect) {
        const run = s.perfectRun + 1;
        if (run >= 2) {
            const up = s.index < total - 1;
            return { index: up ? s.index + 1 : s.index, perfectRun: 0, missRun: 0, leveledUp: up };
        }
        return { ...s, perfectRun: run, missRun: 0, leveledUp: false };
    }
    const run = s.missRun + 1;
    if (run >= 2)
        return { index: s.index > 0 ? s.index - 1 : s.index, perfectRun: 0, missRun: 0, leveledUp: false };
    return { ...s, perfectRun: 0, missRun: run, leveledUp: false };
}
//# sourceMappingURL=adaptive.js.map