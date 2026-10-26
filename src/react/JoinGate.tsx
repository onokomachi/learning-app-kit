/**
 * 名乗りの入口。単元アプリの中に置く。
 *
 * これが要る理由: 子どもはハブを通らず、単元アプリを直接開く。名乗りは
 * ハブから飛んだURLでしか渡らなかったので、7,846件の記録がすべて匿名のまま
 * 溜まっていた（誰の記録か分からず、児童ごとの分析が1つもできなかった）。
 *
 * **「コードを入れずに つかう」を必ず並べる。** このアプリは受け持ちの学級以外の
 * 子も使う。コードを持っていない子に入力を強いると、入口で学習そのものが止まる。
 * 断った子には二度と出さず、あとから設定で名乗れるようにしてある。
 *
 * 見た目は**インラインスタイルで自己完結**させる。12本のアプリはそれぞれ
 * 別のテーマ（マトリックス・桜吹雪など暗い配色もある）を持っていて、
 * クラス名に頼ると、どれかのアプリで文字が背景に沈む。
 */
import { useEffect, useState } from 'react';
import {
  resolveStudent, claimDevice, chooseAnonymous, getStudent, getJoinChoice, clearStudent, subscribeStudent, verifyUnlock, verifyDemoCode, DEMO_JOIN,
  type ResolveConfig, type StudentIdentity,
} from '../sync/index.js';
import { PlayModeGate } from './PlayModeGate.js';
import { AppAccessGate } from './AppAccessGate.js';

const S = {
  scrim: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(8,12,20,0.66)', backdropFilter: 'blur(3px)',
    display: 'grid', placeItems: 'center', padding: 16,
  },
  card: {
    width: '100%', maxWidth: 380, background: '#fff', borderRadius: 22,
    boxShadow: '0 24px 60px -20px rgba(8,12,20,0.5)', padding: 22,
    fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    color: '#0f2540', boxSizing: 'border-box',
  },
  h: { margin: '0 0 6px', fontSize: 19, fontWeight: 900, letterSpacing: '0.01em' },
  p: { margin: '0 0 16px', fontSize: 13, lineHeight: 1.7, color: '#54637a' },
  label: { display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 6, color: '#34445c' },
  input: {
    width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '2px solid #dde4ee',
    padding: '12px 14px', fontSize: 16, color: '#0f2540', background: '#fff', outline: 'none',
  },
  primary: {
    width: '100%', borderRadius: 12, border: 0, background: '#0ea5e9', color: '#fff',
    fontWeight: 900, fontSize: 16, padding: '13px 0', cursor: 'pointer',
  },
  ghost: {
    width: '100%', marginTop: 10, borderRadius: 12, border: '1px solid #e2e8f0',
    background: '#fff', color: '#54637a', fontWeight: 800, fontSize: 13,
    padding: '11px 0', cursor: 'pointer',
  },
  err: {
    marginTop: 10, fontSize: 13, color: '#be123c', background: '#fff1f2',
    border: '1px solid #fecdd3', borderRadius: 12, padding: '8px 12px',
  },
  note: { marginTop: 14, fontSize: 11, lineHeight: 1.7, color: '#8496ad' },
} satisfies Record<string, React.CSSProperties>;

export interface JoinFormProps {
  config: ResolveConfig;
  /** 名乗れたとき。拾えた過去の記録の件数も渡す */
  onDone?: (student: StudentIdentity, claimed: number) => void;
  /** 「コードを入れずに つかう」を選んだとき。設定から開いたときは出さない */
  onSkip?: () => void;
  /** 設定から開いたときの閉じる操作 */
  onClose?: () => void;
  /**
   * デモモードに入る（学級コード 0000・番号 0 ＋ 先生のパスワード）。渡したアプリだけで使える（SANMON のアプリ紹介用）。
   * 名乗りはしない（記録は送られない）。
   */
  onDemo?: () => void;
}

/** 入力フォームの中身だけ。ゲートにも設定パネルにも同じものを使う */
function JoinForm({ config, onDone, onSkip, onClose, onDemo }: JoinFormProps) {
  const [code, setCode] = useState(() => getStudent()?.joinCode ?? '');
  const [num, setNum] = useState(() => {
    const n = getStudent()?.number;
    return n ? String(n) : '';
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ student: StudentIdentity; claimed: number } | null>(null);
  // 入れまちがいを減らすため、送る前に1回「これで いい？」と聞く
  const [confirming, setConfirming] = useState(false);

  const [demo, setDemo] = useState<'ask' | null>(null);
  const [demoCode, setDemoCode] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // デモモードの合いことば（0000・0）なら、名乗らずに先生のパスワードを聞く
    if (onDemo && code.trim() === DEMO_JOIN.code && Number(num) === DEMO_JOIN.number) { setError(null); setDemo('ask'); return; }
    if (!confirming) { setError(null); setConfirming(true); return; }
    setConfirming(false);
    setBusy(true); setError(null);
    const r = await resolveStudent(config, code, Number(num));
    if (!r.ok) { setBusy(false); setError(r.message); return; }
    // 名乗る前にこの端末が送っていた分も、その子のものにする
    const c = await claimDevice(config, r.student.studentId);
    setBusy(false);
    const claimed = c.events + c.tests;
    setDone({ student: r.student, claimed });
    onDone?.(r.student, claimed);
  };

  if (done) {
    return (
      <div>
        <h2 style={S.h}>ありがとう、{done.student.number}ばんさん</h2>
        <p style={S.p}>
          これからの きろくが せんせいに とどくよ。
          {done.claimed > 0 && <>いままでの <b>{done.claimed}</b> けんも いっしょに とどいたよ。</>}
        </p>
        <button type="button" style={S.primary} onClick={() => onClose?.()}>とじる</button>
      </div>
    );
  }

  if (demo === 'ask' && onDemo) {
    const go = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true); setError(null);
      const r = await verifyDemoCode(config, demoCode);
      setBusy(false);
      if (r.ok) onDemo();
      else { setError(r.message); setDemoCode(''); }
    };
    return (
      <form onSubmit={go}>
        <h2 style={S.h}>デモモード</h2>
        <p style={S.p}>アプリの しょうかい用。すべての町が ひらき、きろくは どこにも おくられないよ。せんせいの パスワードを 入れてね。</p>
        <input style={{ ...S.input, letterSpacing: '0.3em', marginBottom: 14 }} value={demoCode} required autoFocus
          type="password" inputMode="numeric" autoComplete="off" aria-label="パスワード"
          onChange={(e) => setDemoCode(e.target.value.replace(/[^0-9]/g, ''))} />
        <button type="submit" style={{ ...S.primary, opacity: busy ? 0.6 : 1 }} disabled={busy || !demoCode}>
          {busy ? 'たしかめているよ…' : 'デモを はじめる'}
        </button>
        <button type="button" style={S.ghost} onClick={() => { setDemo(null); setError(null); }}>もどる</button>
        {error && <p style={S.err}>{error}</p>}
      </form>
    );
  }

  if (confirming) {
    return (
      <form onSubmit={submit}>
        <h2 style={S.h}>これで いい？</h2>
        <p style={{ ...S.p, fontSize: 15, color: '#0f2540' }}>
          がっきゅうコード <b>{code.trim()}</b> の <b style={{ fontSize: 20 }}>{num}</b> ばん
        </p>
        <p style={S.note}>まちがえると、ほかの人の きろくに なってしまうよ。あとから かえるには せんせいの パスワードが いるよ。</p>
        <button type="submit" style={S.primary}>はい、はじめる</button>
        <button type="button" style={S.ghost} onClick={() => setConfirming(false)}>なおす</button>
      </form>
    );
  }

  return (
    <form onSubmit={submit}>
      <h2 style={S.h}>じぶんのことを おしえてね</h2>
      <p style={S.p}>
        なまえは きかないよ。「どの学級の なんばんの人か」だけが きろくされるよ。
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={S.label} htmlFor="lak-join-code">がっきゅうコード</label>
        <input id="lak-join-code" style={S.input} value={code} required
          onChange={(e) => setCode(e.target.value)} placeholder="せんせいから きいてね" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={S.label} htmlFor="lak-join-num">しゅっせき番号</label>
        <input id="lak-join-num" style={S.input} value={num} required
          type="number" inputMode="numeric" min={onDemo ? 0 : 1} max={100}
          onChange={(e) => setNum(e.target.value)} placeholder="12" />
      </div>

      <button type="submit" style={{ ...S.primary, opacity: busy ? 0.6 : 1 }} disabled={busy}>
        {busy ? 'おくっているよ…' : 'はじめる'}
      </button>

      {onSkip && (
        <button type="button" style={S.ghost} onClick={onSkip}>
          コードを 入れずに つかう
        </button>
      )}
      {onClose && !onSkip && (
        <button type="button" style={S.ghost} onClick={onClose}>やめる</button>
      )}

      {error && <p style={S.err}>{error}</p>}

      <p style={S.note}>
        コードが なくても ぜんぶ つかえるよ。あとから 「せってい」で 入れることも できるよ。
      </p>
    </form>
  );
}

/**
 * 名乗った子が「けす」「入れなおす」をする前に出す、先生のパスワードの入力（ハブでも使う）。
 * 答え合わせはサーバ（verifyUnlock）。あっていたら onUnlocked。
 */
export function UnlockPrompt({ config, student, action, onUnlocked, onClose }: {
  config: ResolveConfig;
  student: StudentIdentity;
  /** 何をするのか（「ばんごうを かえる」など） */
  action: string;
  onUnlocked: () => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const r = await verifyUnlock(config, student.joinCode, code);
    setBusy(false);
    if (r.ok) onUnlocked();
    else { setError(r.message); setCode(''); }
  };
  return (
    <div style={S.scrim} role="dialog" aria-label="せんせいの パスワード">
      <div style={S.card}>
        <form onSubmit={submit}>
          <h2 style={S.h}>せんせいの パスワード</h2>
          <p style={S.p}>
            いまは <b>{student.joinCode}　{student.number}ばん</b>。{action}には、せんせいに パスワードを 入れてもらってね。
          </p>
          <input style={{ ...S.input, letterSpacing: '0.3em', marginBottom: 14 }} value={code} required autoFocus
            type="password" inputMode="numeric" autoComplete="off" aria-label="パスワード"
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} />
          <button type="submit" style={{ ...S.primary, opacity: busy ? 0.6 : 1 }} disabled={busy || !code}>
            {busy ? 'たしかめているよ…' : 'OK'}
          </button>
          <button type="button" style={S.ghost} onClick={onClose}>やめる</button>
          {error && <p style={S.err}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

/**
 * まだ決めていない子にだけ、はじめの1回だけ出す。
 * 名乗った子にも、断った子にも、二度と出ない。
 *
 * あわせて、名乗った子には授業の時間だけ「ひとりか、ふたりで1台か」を聞く
 * （PlayModeGate）。ここに入れておけば、どの単元アプリも kit を上げるだけで入る。
 */
export type JoinChipPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

/**
 * まだ名乗っていない端末に、画面のすみに小さく出し続ける入口。
 *
 * これが要る理由: 名乗りの画面ははじめの1回しか出ない。そこで「コードを入れずに つかう」を
 * 押した端末や、たまたま閉じてしまった端末は、アプリに「せってい」が無いと二度と名乗れない。
 * 実際、国語の4本には入口が無く、ごんぎつねの記録はすべて匿名のまま届いていた
 * （先生の画面で番号ごとの分析ができない。画面上は正常に見えるので気づけない）。
 * JoinGate に入れておけば、どのアプリも kit を上げるだけで入口がつく。
 *
 * 名乗った端末には出さない（授業中にじゃまにならないように）。
 */
function JoinChip({ config, position, onOpen }: {
  config: ResolveConfig; position: JoinChipPosition; onOpen: () => void;
}) {
  const [student, setStudent] = useState<StudentIdentity | null>(() => getStudent());
  useEffect(() => subscribeStudent(setStudent), []);
  if (!config.supabaseUrl || !config.supabaseKey || student) return null;
  const [v, h] = position.split('-') as ['top' | 'bottom', 'left' | 'right'];
  return (
    <button type="button" onClick={onOpen}
      aria-label="がっきゅうコードを入れる"
      style={{
        position: 'fixed', [v]: 12, [h]: 12, zIndex: 9990, // SOLO/DUO の札（右下 12px）と同じ位置
        border: '1px solid #bae6fd', borderRadius: 999, background: 'rgba(240,249,255,0.95)',
        color: '#0369a1', fontWeight: 800, fontSize: 12, padding: '6px 12px', cursor: 'pointer',
        boxShadow: '0 4px 12px -6px rgba(8,12,20,0.35)',
        fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }}>
      がっきゅうコードを 入れる
    </button>
  );
}

export function JoinGate({ config, chip = 'bottom-right' }: {
  config: ResolveConfig;
  /**
   * まだ名乗っていない端末に出す入口の位置。アプリ側に入口があるときだけ false にする。
   * 既定は右下: 名乗ったあと同じ場所に SOLO/DUO の切り替え（PlayModeGate）が出るので、
   * 子どもから見て「右下＝学級とのつながり」が1か所にまとまる。
   */
  chip?: JoinChipPosition | false;
}) {
  const [open, setOpen] = useState(false);
  // すみの入口から開いたとき（「コードを入れずに つかう」は出さず「やめる」にする）
  const [fromChip, setFromChip] = useState(false);

  useEffect(() => {
    // 接続先が無いアプリ（ポータルにつないでいない）では出さない
    if (!config.supabaseUrl || !config.supabaseKey) return;
    // ハブから来た子は名乗りが済んでいる。決めていない子にだけ出す
    if (getJoinChoice() !== null || getStudent() !== null) return;
    setOpen(true);
  }, [config.supabaseUrl, config.supabaseKey]);

  const configured = !!config.supabaseUrl && !!config.supabaseKey;
  if (!open) {
    return (
      <>
        <PlayModeGate enabled={configured} />
        {/* 先生がまだ開いていない単元（PRISM の SOL タブ・学級ごと）は、名乗った子には止める */}
        <AppAccessGate config={config} />
        {chip && <JoinChip config={config} position={chip} onOpen={() => { setFromChip(true); setOpen(true); }} />}
      </>
    );
  }
  return (
    <div style={S.scrim} role="dialog" aria-label="がっきゅうコードの入力">
      <div style={S.card}>
        <JoinForm config={config}
          onSkip={fromChip ? undefined : () => { chooseAnonymous(); setOpen(false); }}
          onClose={() => { setOpen(false); setFromChip(false); }} />
      </div>
    </div>
  );
}

/**
 * 設定パネルに置く1行。いまの状態を見せ、押すと名乗り直せる。
 * 「コードを入れずに つかう」を選んだ子の、あとからの入口になる。
 */
export function JoinSettingsRow({ config, onDemo }: { config: ResolveConfig; onDemo?: () => void }) {
  const [student, setStudent] = useState<StudentIdentity | null>(() => getStudent());
  const [open, setOpen] = useState(false);
  // 名乗った子が変えるときは、先に先生のパスワード（なりすまし・ぬけて戻る のいたずらを防ぐ）
  const [unlock, setUnlock] = useState<'rejoin' | 'clear' | null>(null);

  if (!config.supabaseUrl || !config.supabaseKey) return null;

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px 14px', background: '#f8fafc',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#34445c' }}>がっきゅうコード</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#54637a' }}>
            {student
              ? `${student.joinCode}　${student.number}ばん`
              : 'まだ 入れていないよ（きろくは この たんまつだけ）'}
          </p>
        </div>
        <button type="button" onClick={() => (student ? setUnlock('rejoin') : setOpen(true))}
          style={{
            border: 0, borderRadius: 10, background: '#0ea5e9', color: '#fff',
            fontWeight: 900, fontSize: 13, padding: '9px 14px', cursor: 'pointer',
          }}>
          {student ? '入れなおす' : '入れる'}
        </button>
        {student && (
          <button type="button"
            onClick={() => setUnlock('clear')}
            style={{
              border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff',
              color: '#8496ad', fontWeight: 800, fontSize: 12, padding: '9px 12px', cursor: 'pointer',
            }}>
            けす
          </button>
        )}
      </div>

      {unlock && student && (
        <UnlockPrompt config={config} student={student}
          action={unlock === 'clear' ? 'けすの' : '入れなおすの'}
          onClose={() => setUnlock(null)}
          onUnlocked={() => {
            const what = unlock;
            setUnlock(null);
            if (what === 'clear') { clearStudent(); setStudent(null); } else setOpen(true);
          }} />
      )}

      {open && (
        <div style={S.scrim} role="dialog" aria-label="がっきゅうコードの入力">
          <div style={S.card}>
            <JoinForm config={config}
              onDone={(s) => setStudent(s)}
              onClose={() => setOpen(false)}
              onDemo={onDemo ? () => { setOpen(false); onDemo(); } : undefined} />
          </div>
        </div>
      )}
    </div>
  );
}
