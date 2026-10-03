/**
 * 単元アプリの「枠」のうち、どの単元でも同じ部分。
 *
 * もとは各アプリの src/lib に同じファイルをコピーしていた。コピーだと、
 * 1つのアプリで直した不具合がほかに届かない。実際に、おまかせモードの開始レベルを決める
 * recommendStart は、4つのアプリでそれぞれ別々に直され、5つのアプリでは直らないままだった。
 * そこで中身をここに置き、アプリ側は「設定の読み方」などを渡すだけにする。
 */
export { recommendStart, nextAdaptiveIndex } from './adaptive.js';
export type { AdaptiveStep } from './adaptive.js';
export { createSound } from './sound.js';
export type { Sound } from './sound.js';
export { praiseClear, encourage } from './praise.js';
