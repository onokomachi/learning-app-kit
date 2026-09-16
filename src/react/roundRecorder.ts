/**
 * 1問（1ラウンド）の記録を取る。
 *
 * これまでの記録は「最終的に正解までやり切ったとき」に1件だけ作られ、
 * 途中で何回まちがえたかは捨てられていた。残るのは「一発正解だったか」の真偽だけ。
 * しかも**正解までたどりつかずに離れた問題はどこにも残らない**——
 * できなかった問題ほど記録から消える、という状態だった。
 *
 * そのため「正答率」と呼べるのはラウンド単位の一発正解率までで、
 * 問題単位の実力も、つまずきの深さも数値にできなかった。
 *
 * ここが引き受けるのは3つ。
 *   1. まちがえた回数を数える
 *   2. できたときに1件記録する（まちがえた回数つき）
 *   3. **できないまま画面を離れたときにも1件記録する**（とちゅうでやめた印つき）
 *
 * 中身は React に依存しない `createRoundRecorder` に置いてある。
 * フックはそれを画面の寿命に結びつけるだけ——そうしておくと、
 * 記録の条件（二重記録の防止、触っていないときは残さない等）を
 * Reactを動かさずにテストできる。
 */

/** アプリのストアに渡す1件。アプリ側の ResultRecord から id と ts を除いた形にそろえる。 */
export interface RoundRecord<M extends string = string, D = unknown> {
  moduleId: M;
  skillId: string;
  label: string;
  correct: boolean;
  /** その問題で何回まちがえたか。0なら一発正解 */
  mistakes: number;
  /** 正解までたどりつかずに離れたか */
  abandoned?: boolean;
  /** 本番テストの答案など、アプリ固有の追加情報 */
  detail?: D;
}

/**
 * アプリごとに ModuleId の型も detail の型も違うので、そこは型引数で受ける。
 * こうしておくと `record` にアプリのストアの関数をそのまま渡せて、
 * モジュール名のtypoも型で止まる。
 */
export interface RoundRecorderOptions<M extends string = string, D = unknown> {
  moduleId: M;
  skillId: string;
  /** アプリのストアの記録関数。useProgressStore(s => s.recordResult) をそのまま渡す */
  record: (rec: RoundRecord<M, D>) => void;
  /** とちゅうでやめたときに残すラベル。問題文が分かっていれば渡す */
  abandonLabel?: () => string;
  /**
   * まだ1回も答えていないうちに離れた場合も記録するか。既定は false。
   * 「開いただけで閉じた」を「できなかった問題」として数えないため。
   */
  recordUntouched?: boolean;
}

export interface RoundRecorder<D = unknown> {
  /** まちがえたときに呼ぶ */
  mistake: () => void;
  /** できたときに呼ぶ。以後は何度呼んでも、離れても、二重に記録されない */
  finish: (label: string, extra?: { detail?: D }) => void;
  /** 画面を離れるときに呼ぶ。できていなければ「とちゅうでやめた」として1件残す */
  leave: () => void;
  /**
   * 次の問題へ移るときに呼ぶ。
   *
   * 1つの画面で問題を切りかえ続けるモジュール（エラーハンターなど）のためのもの。
   * まだできていなければ「とちゅうでやめた」として1件残してから、数え直す。
   * 画面ごと作り直される作りのモジュールでは要らない（アンマウントで leave が走る）。
   */
  next: () => void;
  /** いまの誤答回数 */
  count: () => number;
}

/** React を使わない本体。テストはこちらを直接ためす。 */
export function createRoundRecorder<M extends string = string, D = unknown>(
  getOptions: () => RoundRecorderOptions<M, D>,
): RoundRecorder<D> {
  let mistakes = 0;
  let done = false;
  let touched = false;

  /**
   * その問題に手をつけた時点の設定を覚えておく。
   *
   * 1つの画面で問題を切りかえ続けるモジュールでは、次の問題が描かれたあとに
   * 「前の問題をやめた」ことが分かる。そのとき現在の設定を使うと、
   * **やめた記録が次の問題のものとして残ってしまう**。
   */
  let opened: RoundRecorderOptions<M, D> | null = null;
  /**
   * ラベルは**関数ではなく値で**控える。
   * abandonLabel をあとから呼ぶと、そのときの問題の文言を返してしまい、
   * やめた記録に次の問題の見出しが入る（テストで実際に踏んだ）。
   */
  let openedLabel = '';

  const close = () => {
    if (done) return;
    done = true;
    const o = opened ?? getOptions();
    if (!touched && !o.recordUntouched) return;
    o.record({
      moduleId: o.moduleId,
      skillId: o.skillId,
      label: opened ? openedLabel : (o.abandonLabel?.() ?? ''),
      correct: false,
      mistakes,
      abandoned: true,
    });
  };

  return {
    mistake: () => {
      if (!touched) {
        // 手をつけた時点の問題を覚える。ラベルは値にして控える
        opened = getOptions();
        openedLabel = opened.abandonLabel?.() ?? '';
      }
      mistakes += 1;
      touched = true;
    },

    finish: (label, extra) => {
      if (done) return;
      done = true;
      const o = opened ?? getOptions();
      o.record({
        moduleId: o.moduleId,
        skillId: o.skillId,
        label,
        correct: mistakes === 0,
        mistakes,
        ...(extra?.detail !== undefined ? { detail: extra.detail } : {}),
      });
    },

    leave: close,

    next: () => {
      close();
      mistakes = 0;
      done = false;
      touched = false;
      opened = null;
      openedLabel = '';
    },

    count: () => mistakes,
  };
}
