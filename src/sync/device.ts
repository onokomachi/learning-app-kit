/**
 * 端末ごとの匿名ID。
 *
 * Phase 1 では認証を入れないので、これは「誰か」ではなく「どの端末か」を表す。
 * Googleログインを入れる Phase 2 で、sub の HMAC から作る本物の匿名IDに置き換える。
 * そのとき、この端末IDで送ったデータは device_key を手がかりに紐づけ直せる。
 *
 * 重要: ここには氏名・メールアドレス・学籍番号などを一切入れない。
 */
const KEY = 'lak_device_key_v1';

function randomKey(): string {
  // crypto.randomUUID はブラウザ・Nodeの新しめの版にしか無いのでフォールバックを持つ
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* 下のフォールバックへ */
  }
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** この端末の匿名ID。無ければ作って保存する。localStorage が使えない環境では毎回新規になる。 */
export function getDeviceKey(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const key = randomKey();
    localStorage.setItem(KEY, key);
    return key;
  } catch {
    // プライベートブラウジング等。同期はできないが学習は止めない
    return randomKey();
  }
}
