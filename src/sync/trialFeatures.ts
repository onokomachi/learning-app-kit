/**
 * 体験版で オン・オフできる項目（2026-11-07 先生と決めた）。PRISM の管理タブと、各アプリの画面が同じ一覧を使う。
 *
 * アプリの種類ごとに項目がちがう。キーはサーバの trial_settings.features にそのまま入る（変えると設定がずれる）。
 * - 算数：練習・本番テスト・実力の階段・ボス戦
 * - 国語（本文あり）：本文・問題・漢字・組み立て（対比）
 * - 英語：教材A・教材B・Can-Do チェック
 * - SANMON：モード（クラス対戦は学級が要るので、体験ではいつも閉じる）
 * - つなぎ言葉：項目なし（アプリ全体を出す／出さないだけ）
 */
export type TrialFamily = 'math' | 'kokugo' | 'eigo' | 'sanmon' | 'whole';

export interface TrialFeature { key: string; label: string }

export const TRIAL_FEATURE_SETS: Record<TrialFamily, readonly TrialFeature[]> = {
  math: [
    { key: 'practice', label: '練習' },
    { key: 'test', label: '本番テスト' },
    { key: 'stairs', label: '実力の階段' },
    { key: 'boss', label: 'ボス戦' },
  ],
  kokugo: [
    { key: 'read', label: '本文' },
    { key: 'quiz', label: '問題' },
    { key: 'kanji', label: '漢字' },
    { key: 'structure', label: '組み立て（対比）' },
  ],
  eigo: [
    { key: 'a', label: '教材A' },
    { key: 'b', label: '教材B' },
    { key: 'cando', label: 'Can-Do チェック' },
  ],
  sanmon: [
    { key: 'adventure', label: 'ぼうけん' },
    { key: 'speed', label: 'スピードデュエル' },
    { key: 'monster', label: 'モンスター対戦' },
    { key: 'practice', label: '練習' },
    { key: 'review', label: '復習' },
    { key: 'mock_test', label: '本番テスト' },
  ],
  whole: [],
};

const KOKUGO = new Set(['gongitsune', 'hitotsunohana', 'shiroiboushi', 'upandloose', 'kougeihin']);

/** app_id から種類を決める。一覧に無いものは算数（算数の単元アプリはみな同じ4つの画面を持つ） */
export function trialFamilyOf(appId: string): TrialFamily {
  if (KOKUGO.has(appId)) return 'kokugo';
  if (appId === 'eigo4') return 'eigo';
  if (appId === 'sanmon') return 'sanmon';
  if (appId === 'tsunagi') return 'whole';
  return 'math';
}

/** 算数アプリの画面（App.tsx の view.kind）→ 項目のキー。HUB・LOG など 項目に入らない画面は null */
export function mathTrialKey(kind: string): string | null {
  switch (kind) {
    case 'MODULE': return 'practice';
    case 'TEST': case 'REFLECT': return 'test';
    case 'TRIAL': return 'stairs';
    case 'BOSS': return 'boss';
    default: return null;
  }
}
