export interface Adaptive<L extends string> {
    level: L;
    index: number;
    total: number;
    leveledUp: boolean;
    clearLevelUp: () => void;
    onResult: (perfect: boolean) => void;
}
export declare function useAdaptiveLevels<L extends string>(levelIds: readonly L[], getMastery: (skillId: string) => number, toSkillId?: (levelId: L) => string): Adaptive<L>;
//# sourceMappingURL=useAdaptiveLevels.d.ts.map