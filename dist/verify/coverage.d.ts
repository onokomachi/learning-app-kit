/**
 * カバレッジ監査の汎用部分。「何通り出るか」と「どんな形が出るか」を数える。
 *
 * 0件の形は「たまたま出なかった」ではなく「設計上その形が作られない」シグナルなので
 * 失敗として扱う（guides/unit-test-coverage-audit-procedure）。
 * どの形を数えるか（checks）は単元固有なので、アプリ側が渡す。
 */
import type { Reporter } from './reporter.js';
import type { ProblemLike } from './checks.js';
import type { LevelLike, TestStepLike } from './structure.js';
export interface CollectArgs<P extends ProblemLike> {
    skillIds: readonly string[];
    generate(skillId: string): P;
    /** 1スキルあたりの生成回数（既定 4000。env N で上書き可） */
    n?: number;
    /** 各レベルに必要なバリエーション数（既定 20） */
    minVariations?: number;
}
/** 全スキルぶん生成してサンプルを集め、バリエーション数（signature の種類）を検査する */
export declare function collectSamples<P extends ProblemLike>(r: Reporter, a: CollectArgs<P>): Record<string, P[]>;
/** 「どんな形が出るか」を、名前つきの述語で数える。0件は失敗 */
export declare function checkShapes<P extends ProblemLike>(r: Reporter, all: readonly P[], checks: Record<string, (p: P) => boolean>, title?: string): void;
/** 解答UIの種類がすべて出るか（数値入力だけで代用していないか） */
export declare function checkAnswerKinds<P extends ProblemLike>(r: Reporter, all: readonly P[], kinds: readonly string[]): void;
export interface TestPointsArgs {
    testSteps: readonly TestStepLike[];
    moduleLevels: Record<string, readonly LevelLike[]>;
    modules: readonly {
        id: string;
        title: string;
    }[];
    totalMax: number;
}
/** 本番テストの配点（モジュール別）。1問も出ないモジュールは失敗 */
export declare function checkTestPoints(r: Reporter, a: TestPointsArgs): void;
//# sourceMappingURL=coverage.d.ts.map