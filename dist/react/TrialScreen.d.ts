/**
 * 実力の階段（STEP TO 算数MASTER）の画面。どの算数アプリでも同じ見た目・同じ決まり。
 *
 *   極限 … やさしい段から登る。各段2問、同じ段で2回まちがえたら止まる。範囲は本番テストと同じ
 *   無限 … 頂点に1度たどりついた子だけ。単元のすべての項目で、3回まちがえるまで挑み続ける
 *
 * アプリが渡すのは「段（どの項目を出すか）」「本番テストとの対応」と、
 * 1問を作る関数・出す関数だけ。問題は**練習・本番テストと同じ画面**で出す。
 *
 * 1問は「ノーミスで解けたら正解」。1回まちがえた時点で×にして次へ進む。
 * 始めるときは必ずソロに切り替える（ペアの力で段を上げないように）。
 * 記録は端末に保存し、学級コードがあればサーバにも送る。アプリの学習ログには入れない。
 *
 * 見た目: 黒地にネオンの水色（自分の進み）と、オレンジ（セーブ＝消えない到達）の2色だけ。
 * インラインスタイルで自己完結させる（アプリごとのテーマに左右されない）。
 * 数字は他の子と比べない。比べるのは過去の自分だけ。
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
    /** 段。やさしい順。skills はその段で出す項目の記号。極限はこの範囲（＝本番テストの範囲） */
    floors: readonly TrialFloorDef[];
    /**
     * 無限で出す段。本番テストに出ない項目も入れる（withExtraSkills で作る）。省略すると floors。
     * generate / render は、ここに入れた項目も作れる・出せるようにしておく。
     */
    endlessFloors?: readonly TrialFloorDef[];
    /** 本番テストの各設問が何段まで突破していれば取れるか（予想点に使う） */
    testReqs: readonly TestItemReq[];
    testMax: number;
    /** 1問を作る。問題が変わるたびに1回だけ呼ぶ */
    generate: (skillId: string, floor: number) => Q;
    /** 1問を出す。練習・本番テストと同じ解答画面を返す */
    render: (q: Q, h: TrialQuestionHandlers) => ReactNode;
    onExit: () => void;
    exitLabel?: string;
    /** 結果から「やるべき段」の練習へ飛ぶ。記号はその段の最初の項目 */
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
 * 今の段とセーブを、端末の記録から出す。
 */
export declare function TrialCard({ appId, floors, onClick }: {
    appId: string;
    floors: number;
    onClick: () => void;
}): import("react").JSX.Element;
/** カードの左に置く小さな階段。届いた段は水色、セーブした段はオレンジ */
export declare function MiniStairs({ F, reached, saved, size }: {
    F: number;
    reached: number;
    saved: number;
    size?: number;
}): import("react").JSX.Element;
//# sourceMappingURL=TrialScreen.d.ts.map