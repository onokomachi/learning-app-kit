/**
 * おまかせモード（適応難易度）。決まりは learning-app-kit/app の recommendStart / nextAdaptiveIndex。
 *
 * アプリ側は1行で包む:
 *   export function useAdaptive<L extends string>(levelIds: L[], toSkillId?: (l: L) => string) {
 *     return useAdaptiveLevels(levelIds, useProgressStore((s) => s.getMastery), toSkillId);
 *   }
 */
import { useRef, useState } from 'react';
import { recommendStart, nextAdaptiveIndex } from '../app/adaptive.js';
export function useAdaptiveLevels(levelIds, getMastery, toSkillId) {
    const [index, setIndex] = useState(() => recommendStart(getMastery, levelIds, toSkillId));
    const [leveledUp, setLeveledUp] = useState(false);
    const step = useRef({ index, perfectRun: 0, missRun: 0, leveledUp: false });
    const onResult = (perfect) => {
        const next = nextAdaptiveIndex({ ...step.current, index }, perfect, levelIds.length);
        step.current = next;
        if (next.leveledUp)
            setLeveledUp(true);
        if (next.index !== index)
            setIndex(next.index);
    };
    return {
        level: levelIds[index],
        index,
        total: levelIds.length,
        leveledUp,
        clearLevelUp: () => setLeveledUp(false),
        onResult,
    };
}
//# sourceMappingURL=useAdaptiveLevels.js.map