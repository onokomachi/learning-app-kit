import { type RoundRecorder, type RoundRecorderOptions } from './roundRecorder.js';
/** 画面の寿命に結びつける。アンマウント時に leave() が走る。 */
export declare function useRoundRecorder<M extends string = string, D = unknown>(opts: RoundRecorderOptions<M, D>): RoundRecorder<D>;
//# sourceMappingURL=useRoundRecorder.d.ts.map