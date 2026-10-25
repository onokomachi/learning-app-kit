import { type ResolveConfig, type StudentIdentity } from '../sync/index.js';
export interface JoinFormProps {
    config: ResolveConfig;
    /** 名乗れたとき。拾えた過去の記録の件数も渡す */
    onDone?: (student: StudentIdentity, claimed: number) => void;
    /** 「コードを入れずに つかう」を選んだとき。設定から開いたときは出さない */
    onSkip?: () => void;
    /** 設定から開いたときの閉じる操作 */
    onClose?: () => void;
    /**
     * デモモードに入る（学級コード 0000・番号 0 ＋ 先生のパスワード）。渡したアプリだけで使える（SANMON のアプリ紹介用）。
     * 名乗りはしない（記録は送られない）。
     */
    onDemo?: () => void;
}
/**
 * 名乗った子が「けす」「入れなおす」をする前に出す、先生のパスワードの入力（ハブでも使う）。
 * 答え合わせはサーバ（verifyUnlock）。あっていたら onUnlocked。
 */
export declare function UnlockPrompt({ config, student, action, onUnlocked, onClose }: {
    config: ResolveConfig;
    student: StudentIdentity;
    /** 何をするのか（「ばんごうを かえる」など） */
    action: string;
    onUnlocked: () => void;
    onClose: () => void;
}): import("react").JSX.Element;
/**
 * まだ決めていない子にだけ、はじめの1回だけ出す。
 * 名乗った子にも、断った子にも、二度と出ない。
 *
 * あわせて、名乗った子には授業の時間だけ「ひとりか、ふたりで1台か」を聞く
 * （PlayModeGate）。ここに入れておけば、どの単元アプリも kit を上げるだけで入る。
 */
export type JoinChipPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
export declare function JoinGate({ config, chip }: {
    config: ResolveConfig;
    /**
     * まだ名乗っていない端末に出す入口の位置。アプリ側に入口があるときだけ false にする。
     * 既定は右下: 名乗ったあと同じ場所に SOLO/DUO の切り替え（PlayModeGate）が出るので、
     * 子どもから見て「右下＝学級とのつながり」が1か所にまとまる。
     */
    chip?: JoinChipPosition | false;
}): import("react").JSX.Element;
/**
 * 設定パネルに置く1行。いまの状態を見せ、押すと名乗り直せる。
 * 「コードを入れずに つかう」を選んだ子の、あとからの入口になる。
 */
export declare function JoinSettingsRow({ config, onDemo }: {
    config: ResolveConfig;
    onDemo?: () => void;
}): import("react").JSX.Element | null;
//# sourceMappingURL=JoinGate.d.ts.map