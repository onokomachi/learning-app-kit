/**
 * 神域の試練の画面（どの算数アプリでも同じ見た目・同じ決まり）。
 *
 *   極限 … やさしい層から登る。各層2問、同じ層で2回まちがえたら止まる。
 *   無限 … 神座に1度たどりついた子だけ。3回まちがえるまで挑み続ける。
 *
 * アプリが渡すのは「層（どの項目を出すか）」「本番テストとの対応」と、
 * 1問を作る関数・出す関数だけ。問題は**練習・本番テストと同じ画面**で出す
 * （練習で解ける問題は試練でも解ける。見たことのない形で測らない）。
 *
 * 1問は「ノーミスで解けたら正解」。1回まちがえた時点で×にして次へ進む
 * （測る場面なので、ヒントを見ながらの正解は数えない）。
 * 始めるときは必ずソロに切り替える（ペアの力で層を上げないように）。
 * 記録は端末に保存し、学級コードがあればサーバにも送る。アプリの学習ログには入れない。
 *
 * 見た目はインラインスタイルで自己完結させる（アプリごとのテーマに左右されない）。
 */
import { type ReactNode } from 'react';
import { type TrialFloorDef, type TestItemReq } from '../trial/index.js';
export interface TrialQuestionHandlers {
    /** 解き終わったとき。perfect=ノーミス */
    onResult: (perfect: boolean) => void;
    /** 1回まちがえたとき（その時点で×にして次へ） */
    onMiss: () => void;
}
export interface TrialScreenProps<Q> {
    appId: string;
    supabaseUrl?: string;
    supabaseKey?: string;
    /** 層。やさしい順。skills はその層で出す項目の記号 */
    floors: readonly TrialFloorDef[];
    /** 本番テストの各設問が何層まで突破していれば取れるか（予想点に使う） */
    testReqs: readonly TestItemReq[];
    testMax: number;
    /** 1問を作る。問題が変わるたびに1回だけ呼ぶ */
    generate: (skillId: string, floor: number) => Q;
    /** 1問を出す。練習・本番テストと同じ解答画面を返す */
    render: (q: Q, h: TrialQuestionHandlers) => ReactNode;
    onExit: () => void;
    exitLabel?: string;
    /** 結果から「やるべき層」の練習へ飛ぶ。記号はその層の最初の項目 */
    onPractice?: (skillId: string) => void;
    sound?: {
        correct?: () => void;
        miss?: () => void;
        clear?: () => void;
    };
}
export declare function TrialScreen<Q>(props: TrialScreenProps<Q>): import("react").JSX.Element;
/**
 * ハブに置く入口のカード。**ハブのいちばん下に置く**（毎日の練習の入口より目立たせない）。
 * 今の層と刻印を、端末の記録から出す。
 */
export declare function TrialCard({ appId, floors, onClick }: {
    appId: string;
    floors: number;
    onClick: () => void;
}): import("react").JSX.Element;
//# sourceMappingURL=TrialScreen.d.ts.map