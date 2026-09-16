/**
 * createRoundRecorder を画面の寿命に結びつけるだけの薄い層。
 *
 * 記録の条件（二重記録の防止、触っていないときは残さない、
 * できないまま離れたら残す）は roundRecorder.ts 側にあり、
 * React を動かさずにテストできる。ここは配線だけにしてある。
 */
import { useEffect, useRef } from 'react';
import { createRoundRecorder, type RoundRecorder, type RoundRecorderOptions } from './roundRecorder.js';

/** 画面の寿命に結びつける。アンマウント時に leave() が走る。 */
export function useRoundRecorder<M extends string = string, D = unknown>(
  opts: RoundRecorderOptions<M, D>,
): RoundRecorder<D> {
  // 後片付けの時点では「最後に渡された設定」が要る。
  // 依存配列に入れて作り直すと数えた回数が消えるので、refで持つ。
  const latest = useRef(opts);
  latest.current = opts;

  const ref = useRef<RoundRecorder<D> | null>(null);
  if (ref.current === null) ref.current = createRoundRecorder(() => latest.current);

  useEffect(() => () => { ref.current?.leave(); }, []);
  return ref.current;
}
