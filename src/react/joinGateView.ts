/**
 * JoinGate が いま出すもの（React を使わない純粋な関数。kit の試験で使う。2026-11-16 CW-5c）。
 * - trial：体験中（しるしと「出さない」アプリの画面だけ）
 * - required：ログイン必須で まだ名乗っていない（閉じられない入力画面）
 * - form：はじめの1回の入力画面（open のとき）
 * - parts：ふだん。playMode＝SOLO/DUO（PlayModeGate）・access＝単元の鍵（AppAccessGate）・chip＝すみの入口
 */
export type JoinGateView =
  | { kind: 'trial' }
  | { kind: 'required' }
  | { kind: 'form' }
  | { kind: 'parts'; playMode: boolean; access: true; chip: boolean };

export function joinGateView(o: {
  trial: boolean; configured: boolean; requireJoin: boolean; named: boolean; allowWithout: boolean;
  open: boolean; playMode: boolean; chip: boolean;
}): JoinGateView {
  if (o.trial) return { kind: 'trial' };
  if (o.configured && o.requireJoin && !o.named && !o.allowWithout) return { kind: 'required' };
  if (o.open) return { kind: 'form' };
  return { kind: 'parts', playMode: o.configured && o.playMode, access: true, chip: o.chip };
}

