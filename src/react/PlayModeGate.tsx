/**
 * 「ひとりで解いているか、2人で1台を使っているか」を聞く画面と、
 * 画面の隅の小さな切り替えボタン。仕組みは sync/playMode.ts。
 *
 * JoinGate の中から出すので、単元アプリ側は何も足さなくてよい。
 * 出るのは「学級コードあり・平日の授業の時間」だけ。それ以外は何も描かない。
 *
 * 見た目はどのアプリのテーマの上でも読めるように、インラインスタイルで自己完結させる。
 */
import { useEffect, useState } from 'react';
import {
  currentPlayMode, needsPlayModeAsk, setPlayMode, subscribePlayMode, isSchoolTime,
  getStudent, subscribeStudent, type PlayMode,
} from '../sync/index.js';

const FONT = 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';

const S = {
  scrim: {
    position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(4,7,14,0.72)',
    backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 16,
  },
  card: {
    width: '100%', maxWidth: 400, boxSizing: 'border-box', borderRadius: 22, padding: 22,
    background: 'linear-gradient(160deg,#0d1422,#070b14)', color: '#e6efff', fontFamily: FONT,
    border: '1px solid rgba(34,211,238,0.35)',
    boxShadow: '0 0 0 1px rgba(34,211,238,0.12), 0 24px 60px -18px rgba(34,211,238,0.35)',
  },
  eyebrow: { margin: 0, fontSize: 11, letterSpacing: '0.28em', color: '#67e8f9', fontWeight: 800 },
  h: { margin: '6px 0 16px', fontSize: 20, fontWeight: 900 },
  choice: (accent: string) => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
    padding: '14px 16px', marginBottom: 10, borderRadius: 16, cursor: 'pointer',
    background: 'rgba(255,255,255,0.03)', color: '#e6efff', fontFamily: FONT,
    border: `1px solid ${accent}`, boxShadow: `inset 0 0 22px -12px ${accent}`,
  }),
  tag: (accent: string) => ({
    minWidth: 58, fontSize: 15, fontWeight: 900, letterSpacing: '0.18em', color: accent,
  }),
  sub: { fontSize: 14, fontWeight: 800 },
  note: { margin: '8px 0 0', fontSize: 11, lineHeight: 1.7, color: '#8ea3c2' },
  pill: (duo: boolean) => ({
    position: 'fixed', right: 12, bottom: 12, zIndex: 9980, fontFamily: FONT,
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px',
    borderRadius: 999, cursor: 'pointer', fontSize: 11, fontWeight: 900, letterSpacing: '0.16em',
    background: 'rgba(7,11,20,0.82)', backdropFilter: 'blur(4px)',
    color: duo ? '#f0abfc' : '#67e8f9',
    border: `1px solid ${duo ? 'rgba(240,171,252,0.55)' : 'rgba(103,232,249,0.5)'}`,
  }),
} satisfies Record<string, unknown>;

const SOLO = '#67e8f9';
const DUO = '#f0abfc';

export function PlayModeGate({ enabled = true }: { enabled?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    // 45分たったか・授業の時間に入ったかを見張る（30秒ごと）
    const id = setInterval(() => setNow(Date.now()), 30_000);
    const offMode = subscribePlayMode(() => { setNow(Date.now()); setTick((t) => t + 1); });
    const offStudent = subscribeStudent(() => setTick((t) => t + 1));
    return () => { clearInterval(id); offMode(); offStudent(); };
  }, [enabled]);

  if (!enabled || getStudent() === null || !isSchoolTime(new Date(now))) return null;

  const mode = currentPlayMode(now);
  const choose = (m: PlayMode) => { setPlayMode(m); setNow(Date.now()); };

  if (needsPlayModeAsk(now)) {
    return (
      <div style={S.scrim as React.CSSProperties} role="dialog" aria-label="ひとりか ふたりか">
        <div style={S.card as React.CSSProperties}>
          <p style={S.eyebrow as React.CSSProperties}>MODE SELECT</p>
          <h2 style={S.h as React.CSSProperties}>いま、どうやって とく？</h2>
          <button type="button" onClick={() => choose('solo')} style={S.choice(SOLO) as React.CSSProperties}>
            <span style={S.tag(SOLO) as React.CSSProperties}>SOLO</span>
            <span style={S.sub as React.CSSProperties}>ひとりで とく</span>
          </button>
          <button type="button" onClick={() => choose('duo')} style={S.choice(DUO) as React.CSSProperties}>
            <span style={S.tag(DUO) as React.CSSProperties}>DUO</span>
            <span style={S.sub as React.CSSProperties}>ふたりで 1台を つかう</span>
          </button>
          <p style={S.note as React.CSSProperties}>
            ふたりで といた きろくは、きみの 実力の 計算には 入れないよ。
            とちゅうで かわったら、右下の ボタンで きりかえてね。
          </p>
        </div>
      </div>
    );
  }

  const duo = mode === 'duo';
  return (
    <button type="button" onClick={() => choose(duo ? 'solo' : 'duo')}
      title={duo ? 'いまは ふたりで つかっている（おすと ひとりに きりかえ）' : 'いまは ひとりで といている（おすと ふたりに きりかえ）'}
      aria-label={duo ? 'ふたりモード。おすと ひとりに きりかえ' : 'ひとりモード。おすと ふたりに きりかえ'}
      style={S.pill(duo) as React.CSSProperties}>
      <span aria-hidden>{duo ? '●●' : '●'}</span>{duo ? 'DUO' : 'SOLO'}
    </button>
  );
}
