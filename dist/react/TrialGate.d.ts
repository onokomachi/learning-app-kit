import { isTrial, type PortalAppConfig } from '../sync/index.js';
/** いまの設定（読めたら更新される） */
export declare function usePortalConfig(): PortalAppConfig | null;
/** 体験中で、その項目が閉じていれば そのキー。使えるなら null（体験中でなければ いつも null） */
export declare function useTrialLocked(key: string | null | undefined): string | null;
/** 体験中に、項目ごとに使えるかを調べる関数を返す（画面の中で何度も調べるとき） */
export declare function useTrialAllows(): (key: string | null | undefined) => boolean;
/** 体験で閉じた項目の画面の代わり。onBack で前の画面（メニュー）にもどる */
export declare function TrialLock({ onBack, label }: {
    onBack: () => void;
    label?: string;
}): import("react").JSX.Element;
/** 体験中のタブのしるし。「おわる」で ふつうにもどる */
export declare function TrialBanner(): import("react").JSX.Element;
/** PRISM で「体験に出さない」にしたアプリを、体験で開いたとき */
export declare function TrialNotListed(): import("react").JSX.Element;
export { isTrial };
//# sourceMappingURL=TrialGate.d.ts.map