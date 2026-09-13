/**
 * アプリ構成の整合性検査（レベル定義・本番テスト構成）。
 *
 *  - 本番テストに一度も出ないレベルが無いか
 *  - 表・裏の満点が想定どおりか、丸数字（設問の sub）に重複が無いか
 *  - レベル定義の重複、画面に出ないレベル、moduleId と skillId 接頭辞の不一致
 *    （bugs/label-implementation-mismatch-and-unused-components）
 */
import type { Reporter } from './reporter.js';
export interface LevelLike {
    id: string;
    label?: string;
}
export interface TestStepLike {
    sub?: string;
    section: string;
    points: number;
    pool: readonly string[];
}
export interface StructureArgs {
    skillIds: readonly string[];
    moduleLevels: Record<string, readonly LevelLike[]>;
    generate(skillId: string): {
        moduleId?: string;
    };
    testSteps?: readonly TestStepLike[];
    /** 本番テストに含まれていないスキル（アプリ側の関数）。無ければ testSteps.pool から計算 */
    skillsMissingFromTest?: () => string[];
    /** セクション名 → 期待する満点。例: { 表: 100, 裏: 50 } */
    expectedSectionMax?: Record<string, number>;
}
export declare function checkStructure(r: Reporter, a: StructureArgs): void;
//# sourceMappingURL=structure.d.ts.map