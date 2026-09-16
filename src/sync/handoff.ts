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
import { getStudent, resolveStudent, type ResolveConfig, type StudentIdentity } from './student.js';

/**
 * ブラウザのURL回りだけを、必要な形で取り出す。
 * kit は DOM の型を持たない（Node からも読めるようにしてある）ので、
 * ここで「ブラウザでしか動かない部分」を1か所に閉じ込める。
 * ブラウザ以外では null を返し、呼び出し側は何もしない。
 */
interface UrlEnv {
  hash: string;
  replaceWithoutHash: () => void;
}

function urlEnv(): UrlEnv | null {
  const g = globalThis as {
    location?: { hash?: string; pathname?: string; search?: string };
    history?: { replaceState?: (a: unknown, b: string, c: string) => void };
  };
  const loc = g.location;
  if (!loc || typeof loc.hash !== 'string') return null;
  return {
    hash: loc.hash,
    replaceWithoutHash: () => {
      try {
        g.history?.replaceState?.(null, '', `${loc.pathname ?? ''}${loc.search ?? ''}`);
      } catch {
        /* 消せなくても動作には影響しない */
      }
    },
  };
}

/** ハブがリンクを作るときに使う。例: buildHandoffUrl('https://app.vercel.app', '4-2', 12) */
export function buildHandoffUrl(appUrl: string, joinCode: string, number: number): string {
  const p = new URLSearchParams({ c: joinCode, n: String(number) });
  return `${appUrl.replace(/[#?].*$/, '').replace(/\/$/, '')}/#${p.toString()}`;
}

/**
 * URLに名乗りが載っていれば受け取って覚える。アプリの起動時に1回呼ぶ。
 *
 * - すでに名乗っている端末では何もしない（ハブ経由で来るたび上書きしない）
 * - ただし別の番号が指定されていたら、そちらを採る（端末を貸し借りしたとき）
 * - 受け取ったらURLから消す
 */
export async function adoptStudentFromUrl(config: ResolveConfig): Promise<StudentIdentity | null> {
  const url = urlEnv();
  if (!url) return getStudent();

  let joinCode: string | null = null;
  let numberRaw: string | null = null;
  try {
    const p = new URLSearchParams(url.hash.replace(/^#/, ''));
    joinCode = p.get('c');
    numberRaw = p.get('n');
  } catch {
    return getStudent();
  }
  if (!joinCode || !numberRaw) return getStudent();

  const number = Number(numberRaw);
  const current = getStudent();
  // 同じ子が同じリンクで来ただけなら、問い合わせずに済ませる
  if (current && current.joinCode === joinCode.trim() && current.number === number) {
    url.replaceWithoutHash();
    return current;
  }

  const r = await resolveStudent(config, joinCode, number);
  url.replaceWithoutHash();
  return r.ok ? r.student : current;
}
