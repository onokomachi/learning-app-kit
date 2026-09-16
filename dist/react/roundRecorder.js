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
/** React を使わない本体。テストはこちらを直接ためす。 */
export function createRoundRecorder(getOptions) {
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
    let opened = null;
    /**
     * ラベルは**関数ではなく値で**控える。
     * abandonLabel をあとから呼ぶと、そのときの問題の文言を返してしまい、
     * やめた記録に次の問題の見出しが入る（テストで実際に踏んだ）。
     */
    let openedLabel = '';
    const close = () => {
        if (done)
            return;
        done = true;
        const o = opened ?? getOptions();
        if (!touched && !o.recordUntouched)
            return;
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
            if (done)
                return;
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
//# sourceMappingURL=roundRecorder.js.map