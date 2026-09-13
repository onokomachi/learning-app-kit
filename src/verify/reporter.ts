/**
 * 検証スクリプト共通の結果集計。失敗件数を数え、コンソールに整形して出す。
 */
export class Reporter {
  failures = 0;
  /** 失敗の詳細を表示する上限（それ以上は件数だけ数える） */
  maxPrint = 40;

  section(title: string): void {
    console.log(`\n▶ ${title}`);
  }

  ok(msg: string): void {
    console.log(`  ✓ ${msg}`);
  }

  fail(skill: string, msg: string, sample?: { prompt?: string }): void {
    this.failures++;
    if (this.failures <= this.maxPrint) {
      console.error(`  ✗ [${skill}] ${msg}`);
      if (sample?.prompt) console.error(`     prompt: ${sample.prompt}`);
    }
  }

  /** 条件を満たさなければ失敗として数え、結果行を出す */
  assert(cond: boolean, okMsg: string, ngMsg: string): boolean {
    if (cond) this.ok(okMsg);
    else {
      this.failures++;
      console.error(`  ✗ ${ngMsg}`);
    }
    return cond;
  }

  /** 合計を出して終了コードを返す（0 = 合格） */
  finish(label = ''): number {
    const tag = label ? `${label} ` : '';
    console.log(this.failures === 0 ? `\n✅ ${tag}すべて合格` : `\n❌ ${tag}${this.failures} 件の失敗`);
    return this.failures === 0 ? 0 : 1;
  }
}
