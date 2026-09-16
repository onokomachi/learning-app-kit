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
    return {
        mistake: () => { mistakes += 1; touched = true; },
        finish: (label, extra) => {
            if (done)
                return;
            done = true;
            const o = getOptions();
            o.record({
                moduleId: o.moduleId,
                skillId: o.skillId,
                label,
                correct: mistakes === 0,
                mistakes,
                ...(extra?.detail !== undefined ? { detail: extra.detail } : {}),
            });
        },
        leave: () => {
            if (done)
                return;
            done = true; // 離れたあとに二重で走らせない
            const o = getOptions();
            if (!touched && !o.recordUntouched)
                return;
            o.record({
                moduleId: o.moduleId,
                skillId: o.skillId,
                label: o.abandonLabel?.() ?? '',
                correct: false,
                mistakes,
                abandoned: true,
            });
        },
        count: () => mistakes,
    };
}
//# sourceMappingURL=roundRecorder.js.map