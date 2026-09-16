/**
 * ハブから各単元アプリへ、児童の名乗りを引きつぐ。
 *
 * 単元アプリはそれぞれ別のドメイン（*.vercel.app のサブドメイン）なので、
 * localStorage は共有されない。ハブで1回入れた学級コードを各アプリに伝えるには、
 * URL に載せて渡すしかない。
 *
 * 渡すのは「学級コードと出席番号」——子ども自身が打つのと同じ情報にしている。
 * 児童IDそのものを載せないのは、URLが共有・ブックマーク・履歴に残ったときに
 * 「他人になりすませる文字列」を配らないため。受け取った側はサーバに問い合わせ、
 * 名簿に無ければ拒否される。
 *
 * クエリ(?)ではなくハッシュ(#)に載せる。ハッシュはサーバへ送られないので、
 * ホスティングのアクセスログに出席番号が残らない。
 */
import { type ResolveConfig, type StudentIdentity } from './student.js';
/** ハブがリンクを作るときに使う。例: buildHandoffUrl('https://app.vercel.app', '4-2', 12) */
export declare function buildHandoffUrl(appUrl: string, joinCode: string, number: number): string;
/**
 * URLに名乗りが載っていれば受け取って覚える。アプリの起動時に1回呼ぶ。
 *
 * - すでに名乗っている端末では何もしない（ハブ経由で来るたび上書きしない）
 * - ただし別の番号が指定されていたら、そちらを採る（端末を貸し借りしたとき）
 * - 受け取ったらURLから消す
 */
export declare function adoptStudentFromUrl(config: ResolveConfig): Promise<StudentIdentity | null>;
//# sourceMappingURL=handoff.d.ts.map