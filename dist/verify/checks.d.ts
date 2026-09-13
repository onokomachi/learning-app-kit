/**
 * 問題ジェネレーターの汎用プロパティ検査。
 *
 * どの単元アプリでも同じ形で起きるバグ（master-DB の bugs/ に記録されている型）を、
 * 解答UIの種類ごとに機械的に検出する。
 *
 *  - 答えが 負・小数・NaN（未習の数）
 *  - 選択肢の重複／正解 index の範囲外／選択肢が少なすぎる
 *  - 答えが問題文からそのまま拾える（bugs/template-string-duplicate-noun, patterns/math-problem-auto-audit）
 *  - ヒント1段目が答えを言い切っている（patterns/audit-hints-for-answer-leak）
 *  - 誤答診断が正答に反応する（bugs/wrong-answer-diagnosis-collides-with-correct）
 *  - 表うめの見せている値と正解の食いちがい、空欄が無い
 *  - 式づくりのカードに正解トークンが足りない、まちがいカードが無い
 *
 * アプリの型には依存しない（構造的に一致していれば渡せる）。
 */
import type { Reporter } from './reporter.js';
export interface ProblemLike {
    skillId: string;
    moduleId?: string;
    story?: string;
    prompt: string;
    explain: string;
    label: string;
    signature: string;
    hints: readonly string[];
    /** 解答UI。kind で分岐する。アプリ側の union 型（interface）をそのまま渡せる */
    answer: {
        kind: string;
    };
    diagnose?: (given: number) => string | null;
}
export interface CheckOptions {
    /** ヒントの段数（既定 3） */
    hintsCount?: number;
    /** 答えを書いてはいけないヒントの添字（既定 [0] = 1段目）。3段目は言ってよい前提 */
    hintsMustNotLeak?: readonly number[];
    /** 選択肢の最小数（既定 3） */
    minChoices?: number;
    /** 負の答えを許すか（既定 false。小学校では未習） */
    allowNegative?: boolean;
    /** truth 形式で「決まる/正しい」行と「決まらない/反例」行の両方を必須にするか（既定 true） */
    truthNeedsBoth?: boolean;
}
/** 数値が「独立した数」として文字列に出てくるか（"150" に "50" が含まれる誤検出を防ぐ） */
export declare function containsNumber(text: string, n: number): boolean;
/** 1問ぶんの共通検査（問題文・解説・ラベル・署名・ヒント段数） */
export declare function checkCommon(r: Reporter, skill: string, p: ProblemLike, o?: CheckOptions): void;
/** 解答UIの種類ごとの検査。未知の kind は素通し（アプリ側で extra を足す） */
export declare function checkAnswerSpec(r: Reporter, skill: string, p: ProblemLike, o?: CheckOptions): void;
export interface PropertyTestArgs<P extends ProblemLike> {
    skillIds: readonly string[];
    /** メソッド署名にして、引数型が狭い（SkillId など）関数も渡せるようにする */
    generate(skillId: string): P;
    /** 1スキルあたりの生成回数（既定 10000。env N で上書き可） */
    n?: number;
    options?: CheckOptions;
    /** アプリ固有の追加検査 */
    extra?: (r: Reporter, skill: string, p: P) => void;
}
/** 全スキル × N 回 生成して checkCommon / checkAnswerSpec / extra を流す */
export declare function runPropertyTest<P extends ProblemLike>(r: Reporter, args: PropertyTestArgs<P>): void;
//# sourceMappingURL=checks.d.ts.map