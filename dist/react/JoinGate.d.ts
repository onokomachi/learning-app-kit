import { type ResolveConfig, type StudentIdentity } from '../sync/index.js';
export interface JoinFormProps {
    config: ResolveConfig;
    /** 名乗れたとき。拾えた過去の記録の件数も渡す */
    onDone?: (student: StudentIdentity, claimed: number) => void;
    /** 「コードを入れずに つかう」を選んだとき。設定から開いたときは出さない */
    onSkip?: () => void;
    /** 設定から開いたときの閉じる操作 */
    onClose?: () => void;
}
/**
 * まだ決めていない子にだけ、はじめの1回だけ出す。
 * 名乗った子にも、断った子にも、二度と出ない。
 */
export declare function JoinGate({ config }: {
    config: ResolveConfig;
}): import("react").JSX.Element | null;
/**
 * 設定パネルに置く1行。いまの状態を見せ、押すと名乗り直せる。
 * 「コードを入れずに つかう」を選んだ子の、あとからの入口になる。
 */
export declare function JoinSettingsRow({ config }: {
    config: ResolveConfig;
}): import("react").JSX.Element | null;
//# sourceMappingURL=JoinGate.d.ts.map