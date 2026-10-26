/**
 * 先生がまだ開いていない単元アプリを、名乗った子には使えなくする（2026-10-26）。
 *
 * 単元の開け閉めは PRISM の SOL タブで学級ごとに決める（サーバの class_app_access）。
 * SOL では 🔒 で出るが、子どもはブックマークなどでアプリを直接開くので、アプリの中でも止める。
 * JoinGate の中にあるので、各アプリは何もしなくてよい（kit を上げるだけで入る）。
 * 名乗っていない子・ほかの学級の子は止めない。読めないときも止めない（学習を止めない）。
 * アプリにもどってきたとき（visibilitychange）と、名乗りが変わったときに確かめなおす。
 */
import { useEffect, useState } from 'react';
import { getStudent, subscribeStudent, checkAppOpen, SOL_URL, type ResolveConfig, type StudentIdentity } from '../sync/index.js';

export function AppAccessGate({ config }: { config: ResolveConfig }) {
  const [student, setStudent] = useState<StudentIdentity | null>(() => getStudent());
  const [closed, setClosed] = useState(false);

  useEffect(() => subscribeStudent((s) => setStudent(s)), []);

  const { supabaseUrl, supabaseKey } = config;
  const studentId = student?.studentId;
  // config はアプリによって毎回新しいオブジェクトで渡ることがあるので、中の値で見る（読みなおしの繰り返しを防ぐ）
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey || !studentId || typeof window === 'undefined') { setClosed(false); return; }
    let alive = true;
    const check = () => {
      void checkAppOpen({ supabaseUrl, supabaseKey }, studentId, window.location.origin).then((open) => { if (alive) setClosed(!open); });
    };
    check();
    const onVis = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; document.removeEventListener('visibilitychange', onVis); };
  }, [supabaseUrl, supabaseKey, studentId]);

  if (!closed) return null;
  return (
    <div role="dialog" aria-label="まだ ひらいていない たんげん" style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(8,12,20,0.86)', backdropFilter: 'blur(4px)',
      display: 'grid', placeItems: 'center', padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 380, background: '#fff', borderRadius: 22, padding: 24, textAlign: 'center', boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif', color: '#0f2540',
      }}>
        <div style={{ fontSize: 40, lineHeight: 1 }}>🔒</div>
        <p style={{ margin: '12px 0 6px', fontSize: 19, fontWeight: 900 }}>この アプリは まだ ひらいていないよ</p>
        <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.7, color: '#54637a' }}>
          せんせいが ひらいたら つかえるよ。<br />SOL で、いま ひらいている アプリを えらんでね。
        </p>
        <a href={SOL_URL} style={{
          display: 'block', borderRadius: 14, padding: '12px 14px', background: '#1d4ed8', color: '#fff',
          fontWeight: 900, fontSize: 15, textDecoration: 'none',
        }}>SOL に もどる</a>
        <p style={{ margin: '12px 0 0', fontSize: 11, color: '#8a97ab' }}>{student?.joinCode} ・ {student?.number}ばん</p>
      </div>
    </div>
  );
}
