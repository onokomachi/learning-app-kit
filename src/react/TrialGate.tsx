/**
 * 体験版の画面部品（2026-11-07）。
 *
 * - TrialBanner：体験中のタブに、画面のすみに小さく「たいけんばん」と「おわる」を出す（JoinGate が出す）
 * - TrialNotListed：PRISM で「体験に出さない」にしたアプリを体験で開いたときの画面（JoinGate が出す）
 * - TrialLock / useTrialLocked：体験で閉じた項目の画面の代わりに出す（各アプリが画面の切りかえのところで使う）
 *
 * 見た目は JoinGate と同じく、インラインスタイルで自己完結させる（アプリごとのテーマに沈まないように）。
 */
import { useEffect, useState } from 'react';
import {
  getPortalConfig, subscribePortalConfig, trialAllows, isTrial, endTrial, SOL_TRIAL_URL, type PortalAppConfig,
} from '../sync/index.js';

const FONT = 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';

/** いまの設定（読めたら更新される） */
export function usePortalConfig(): PortalAppConfig | null {
  const [cfg, setCfg] = useState<PortalAppConfig | null>(() => getPortalConfig());
  useEffect(() => subscribePortalConfig(setCfg), []);
  return cfg;
}

/** 体験中で、その項目が閉じていれば そのキー。使えるなら null（体験中でなければ いつも null） */
export function useTrialLocked(key: string | null | undefined): string | null {
  const cfg = usePortalConfig();
  if (!key) return null;
  return trialAllows(key, cfg) ? null : key;
}

/** 体験中に、項目ごとに使えるかを調べる関数を返す（画面の中で何度も調べるとき） */
export function useTrialAllows(): (key: string | null | undefined) => boolean {
  const cfg = usePortalConfig();
  return (key) => trialAllows(key, cfg);
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', maxWidth: 380, background: '#fff', borderRadius: 22, padding: 24, textAlign: 'center', boxSizing: 'border-box',
      fontFamily: FONT, color: '#0f2540', boxShadow: '0 24px 60px -20px rgba(8,12,20,0.5)',
    }}>{children}</div>
  );
}

const btn: React.CSSProperties = {
  display: 'block', width: '100%', borderRadius: 14, padding: '12px 14px', background: '#1d4ed8', color: '#fff', border: 0,
  fontWeight: 900, fontSize: 15, textDecoration: 'none', cursor: 'pointer', boxSizing: 'border-box',
};

/** 体験で閉じた項目の画面の代わり。onBack で前の画面（メニュー）にもどる */
export function TrialLock({ onBack, label }: { onBack: () => void; label?: string }) {
  return (
    <div role="dialog" aria-label="たいけんばんでは つかえない" style={{
      width: '100%', height: '100%', minHeight: 320, display: 'grid', placeItems: 'center', padding: 16, boxSizing: 'border-box',
      background: 'rgba(8,12,20,0.55)',
    }}>
      <Card>
        <div style={{ fontSize: 40, lineHeight: 1 }}>🔒</div>
        <p style={{ margin: '12px 0 6px', fontSize: 19, fontWeight: 900 }}>
          {label ? `「${label}」は ` : ''}たいけんばんでは つかえないよ
        </p>
        <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.7, color: '#54637a' }}>
          ほかの ところを ためしてみてね。
        </p>
        <button type="button" style={btn} onClick={onBack}>もどる</button>
      </Card>
    </div>
  );
}

/** 体験中のタブのしるし。「おわる」で ふつうにもどる */
export function TrialBanner() {
  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 10, transform: 'translateX(-50%)', zIndex: 9990,
      display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px 5px 12px', borderRadius: 999,
      background: 'rgba(255,251,235,0.96)', border: '1px solid #fcd34d', boxShadow: '0 4px 12px -6px rgba(8,12,20,0.35)',
      fontFamily: FONT, fontSize: 12, fontWeight: 800, color: '#92400e', pointerEvents: 'auto',
    }}>
      <span>たいけんばん（きろくは のこらないよ）</span>
      <button type="button" onClick={endTrial} style={{
        border: 0, borderRadius: 999, background: '#f59e0b', color: '#fff', fontWeight: 900, fontSize: 11, padding: '4px 10px', cursor: 'pointer',
      }}>おわる</button>
    </div>
  );
}

/** PRISM で「体験に出さない」にしたアプリを、体験で開いたとき */
export function TrialNotListed() {
  return (
    <div role="dialog" aria-label="いまは たいけんできない アプリ" style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(8,12,20,0.86)', backdropFilter: 'blur(4px)',
      display: 'grid', placeItems: 'center', padding: 16,
    }}>
      <Card>
        <div style={{ fontSize: 40, lineHeight: 1 }}>🔒</div>
        <p style={{ margin: '12px 0 6px', fontSize: 19, fontWeight: 900 }}>この アプリは いま たいけんできないよ</p>
        <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.7, color: '#54637a' }}>たいけんの いりぐちから、ほかの アプリを えらんでね。</p>
        <a href={SOL_TRIAL_URL} style={btn}>たいけんの いりぐちへ</a>
      </Card>
    </div>
  );
}

export { isTrial };
