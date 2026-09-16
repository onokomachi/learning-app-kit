/**
 * createRoundRecorder を画面の寿命に結びつけるだけの薄い層。
 *
 * 記録の条件（二重記録の防止、触っていないときは残さない、
 * できないまま離れたら残す）は roundRecorder.ts 側にあり、
 * React を動かさずにテストできる。ここは配線だけにしてある。
 */
import { useEffect, useRef } from 'react';
import { createRoundRecorder } from './roundRecorder.js';
/** 画面の寿命に結びつける。アンマウント時に leave() が走る。 */
export function useRoundRecorder(opts) {
    // 後片付けの時点では「最後に渡された設定」が要る。
    // 依存配列に入れて作り直すと数えた回数が消えるので、refで持つ。
    const latest = useRef(opts);
    latest.current = opts;
    const ref = useRef(null);
    if (ref.current === null)
        ref.current = createRoundRecorder(() => latest.current);
    useEffect(() => () => { ref.current?.leave(); }, []);
    return ref.current;
}
//# sourceMappingURL=useRoundRecorder.js.map