/**
 * おまかせモード（適応難易度）。決まりは learning-app-kit/app の recommendStart / nextAdaptiveIndex。
 *
 * アプリ側は1行で包む:
 *   export function useAdaptive<L extends string>(levelIds: L[], toSkillId?: (l: L) => string) {
 *     return useAdaptiveLevels(levelIds, useProgressStore((s) => s.getMastery), toSkillId);
 *   }
 */
import { useRef, useState } from 'react';
import { recommendStart, nextAdaptiveIndex, type AdaptiveStep } from '../app/adaptive.js';

export interface Adaptive<L extends string> {
  level: L;
  index: number;
  total: number;
  leveledUp: boolean;
  clearLevelUp: () => void;
  onResult: (perfect: boolean) => void;
}

export function useAdaptiveLevels<L extends string>(
  levelIds: readonly L[],
  getMastery: (skillId: string) => number,
  toSkillId?: (levelId: L) => string,
): Adaptive<L> {
  const [index, setIndex] = useState(() =>
    recommendStart(getMastery, levelIds, toSkillId as ((id: string) => string) | undefined));
  const [leveledUp, setLeveledUp] = useState(false);
  const step = useRef<AdaptiveStep>({ index, perfectRun: 0, missRun: 0, leveledUp: false });

  const onResult = (perfect: boolean) => {
    const next = nextAdaptiveIndex({ ...step.current, index }, perfect, levelIds.length);
    step.current = next;
    if (next.leveledUp) setLeveledUp(true);
    if (next.index !== index) setIndex(next.index);
  };

  return {
    level: levelIds[index]!,
    index,
    total: levelIds.length,
    leveledUp,
    clearLevelUp: () => setLeveledUp(false),
    onResult,
  };
}
