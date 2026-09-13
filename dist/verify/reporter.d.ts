/**
 * 検証スクリプト共通の結果集計。失敗件数を数え、コンソールに整形して出す。
 */
export declare class Reporter {
    failures: number;
    /** 失敗の詳細を表示する上限（それ以上は件数だけ数える） */
    maxPrint: number;
    section(title: string): void;
    ok(msg: string): void;
    fail(skill: string, msg: string, sample?: {
        prompt?: string;
    }): void;
    /** 条件を満たさなければ失敗として数え、結果行を出す */
    assert(cond: boolean, okMsg: string, ngMsg: string): boolean;
    /** 合計を出して終了コードを返す（0 = 合格） */
    finish(label?: string): number;
}
//# sourceMappingURL=reporter.d.ts.map