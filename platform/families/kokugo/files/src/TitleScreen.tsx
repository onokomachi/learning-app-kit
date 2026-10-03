import { useState } from 'react';
import { ChevronRight, ChevronLeft, Flame, BookOpen, RotateCcw, Leaf, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MascotPinto, SpeechBubble } from './Mascot';
import { JoinSettingsRow } from 'learning-app-kit/react';

/** 学級ポータルへの接続。つないでいないアプリでは JoinSettingsRow は何も出さない */
const PORTAL = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};
import { questions, SKILLS, SKILL_ORDER, type Skill } from './data';
import { UNIT } from './unit';
import { MarkDots, MarkLegend, type Mark } from './marks';

interface SceneProgress {
  title: string;  // 例: ごんのいたずら
  label: string;  // 例: 場面一
  solved: number;
  total: number;
  marks: Mark[];
}

interface SkillProgress {
  skill: Skill;
  label: string;
  desc: string;
  solved: number;
  total: number;
  weak: boolean;
  marks: Mark[];
}

interface TitleScreenProps {
  solvedCount: number;
  /** ねばりクリア（一発クリアになっていないもの）の数 */
  gritCount: number;
  streak: number;
  reviewCount: number;
  cycleCount: number;
  masterCount: number;
  cycleBadgeInfo: { label: string; cls: string; icon: string };
  weakSkillLabel: string | null;
  sceneProgress: SceneProgress[];
  skillProgress: SkillProgress[];
  onStart: () => void;
  onStartScene: (pageIndex: number) => void;
  onStartSkill: (skill: Skill) => void;
  onStartTest: () => void;
  onReview: () => void;
  onShowOnboarding: () => void;
}

// タイトル画面の入口。
//   ① きょう読んだ場面の問題（授業の後半に使う）
//   ② 身につけたい力でえらぶ（入口は1つ。中で5つの力から選ぶ。全部の場面から出る）
//   ③ まとめテスト（単元の終わり・テスト前に使う）
//   ④ ふりかえり（まちがえた問題を、次の日以降にもう一度）
export function TitleScreen({
  solvedCount, gritCount, streak, reviewCount, cycleCount, masterCount, cycleBadgeInfo,
  weakSkillLabel, sceneProgress, skillProgress, onStart, onStartScene, onStartSkill, onStartTest, onReview, onShowOnboarding,
}: TitleScreenProps) {
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [skillPicker, setSkillPicker] = useState(false);
  const total = questions.length;
  const progress = total > 0 ? solvedCount / total : 0;

  const greeting =
    cycleCount >= 3 && masterCount === total ? 'マスター完成！すごいね！'
    : solvedCount === 0 ? `きょう読んだ${UNIT.sceneWord}をえらんでね！`
    : solvedCount === total ? 'ぜんぶクリア！まとめテストに挑戦しよう！'
    : `きょうは、どの${UNIT.sceneWord}を読んだかな？`;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-50 rounded-full translate-y-1/2 -translate-x-1/2 opacity-60" />
      </div>

      <AnimatePresence>
        {skillPicker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSkillPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl flex flex-col gap-3"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <Target className="text-violet-500" />
                <h2 className="text-xl font-black text-stone-800">どの力を練習する？</h2>
              </div>
              <p className="text-xs text-stone-500 -mt-1">{UNIT.sceneWord}の順に、その力の問題だけが出るよ。</p>
              {skillProgress.map(sp => (
                <button
                  key={sp.skill}
                  onClick={() => { setSkillPicker(false); onStartSkill(sp.skill); }}
                  className="text-left rounded-2xl border-2 border-stone-200 hover:border-violet-300 hover:bg-violet-50 px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-700">{sp.label}</span>
                    <span className="text-xs text-stone-400">{sp.total}問</span>
                    {sp.weak && <span className="text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">まちがいが多い</span>}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">{sp.desc}</div>
                  <MarkDots marks={sp.marks} />
                </button>
              ))}
              <button onClick={() => setSkillPicker(false)} className="text-stone-400 hover:text-stone-600 text-sm underline self-center">
                とじる
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center gap-5 max-w-xl w-full">
        {/* Header + mascot */}
        <div className="flex items-center gap-4">
          <div className="relative inline-block">
            <SpeechBubble message={greeting} visible={bubbleVisible} position="top" />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              onClick={() => setBubbleVisible(v => !v)}
              className="cursor-pointer"
            >
              <MascotPinto expression="happy" size={120} />
            </motion.div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 text-orange-400 text-sm font-bold tracking-widest">
              <Leaf size={16} />
              <span>{UNIT.publisher}</span>
            </div>
            <h1 className="text-4xl font-black text-stone-800 leading-tight">
              {UNIT.titleMain}<span className="text-orange-500">{UNIT.titleAccent}</span>
            </h1>
            <p className="text-stone-500 mt-1 text-sm">{UNIT.author}</p>
          </div>
        </div>

        {/* ① きょうの場面 */}
        <div className="w-full">
          <p className="text-sm font-bold text-stone-600 mb-2 flex items-center gap-1">
            <BookOpen size={16} className="text-emerald-500" /> きょう読んだ{UNIT.sceneWord}の問題をとく
          </p>
          <div className="grid grid-cols-3 gap-2">
            {sceneProgress.map((sc, i) => {
              const done = sc.total > 0 && sc.solved === sc.total;
              return (
                <motion.button
                  key={sc.label}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onStartScene(i)}
                  className={`rounded-2xl border-2 p-3 text-left transition-colors ${done ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-stone-200 hover:border-orange-300 hover:bg-orange-50'}`}
                >
                  <div className="text-xs font-bold text-orange-500">{sc.label}</div>
                  <div className="font-bold text-stone-700 text-sm leading-tight">{sc.title}</div>
                  <MarkDots marks={sc.marks} />
                </motion.button>
              );
            })}
          </div>
          <div className="mt-2"><MarkLegend /></div>
        </div>

        {/* ② 身につけたい力でえらぶ（入口は1つ） */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setSkillPicker(true)}
          className="w-full -mt-2 rounded-2xl border-2 border-violet-200 bg-violet-50 hover:bg-violet-100 px-4 py-3 flex items-center gap-3 text-left transition-colors"
        >
          <Target size={28} className="text-violet-500 shrink-0" />
          <span className="flex-1">
            <span className="block font-black text-stone-700">身につけたい力でえらぶ</span>
            <span className="block text-xs text-stone-500">{SKILLS[SKILL_ORDER[0]].label}・{SKILLS[SKILL_ORDER[2]].label} などを、全部の{UNIT.sceneWord}から練習</span>
          </span>
          <ChevronRight size={20} className="text-violet-400" />
        </motion.button>

        {/* ③ まとめテスト ④ ふりかえり */}
        <div className="w-full grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onStartTest}
            className="py-3 px-3 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl shadow-md flex items-center gap-2 transition-colors"
          >
            <MascotPinto expression="serious" size={44} />
            <span className="text-left">
              <span className="block font-black text-lg leading-tight">まとめテスト</span>
              <span className="block text-xs text-stone-300">10問・ヒントなし</span>
            </span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onReview}
            disabled={reviewCount === 0}
            className="py-3 px-3 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-2xl shadow-md flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={28} className="shrink-0 ml-1" />
            <span className="text-left">
              <span className="block font-black text-lg leading-tight">ふりかえり</span>
              <span className="block text-xs">
                {reviewCount > 0 ? `まちがえた${reviewCount}問` : 'いまはなし'}
              </span>
            </span>
          </motion.button>
        </div>
        {weakSkillLabel && (
          <p className="w-full -mt-2 text-sm text-stone-600 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
            まちがいが多いのは「<span className="font-bold text-orange-700">{weakSkillLabel}</span>」の問題。ふりかえりで先に出るよ。
          </p>
        )}

        {/* 記録（小さく） */}
        <div className="w-full bg-stone-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-stone-200">
          <span className={`px-3 py-1 rounded-full font-bold text-xs border-2 shrink-0 ${cycleBadgeInfo.cls}`}>
            {cycleBadgeInfo.icon} {cycleBadgeInfo.label}
          </span>
          <div className="flex-1">
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden flex">
              <motion.div
                className="h-full bg-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <motion.div
                className="h-full bg-sky-400"
                initial={{ width: 0 }}
                animate={{ width: `${total > 0 ? (gritCount / total) * 100 : 0}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="text-xs text-stone-500 mt-1">
              この周のクリア ⭐一発 {solvedCount}・💪ねばり {gritCount} ／ {total}問{masterCount > 0 ? `・🥇マスター ${masterCount}問` : ''}
            </div>
          </div>
          {streak > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-orange-600 shrink-0">
              <Flame size={14} className="text-orange-500" />{streak}日
            </span>
          )}
        </div>

        <div className="w-full">
          {/* がっきゅうコード。はじめの画面で「入れずに つかう」を押した子も、ここから入れられる。入れた子は番号が出る */}
          <JoinSettingsRow config={PORTAL} />
        </div>

        <div className="flex gap-4 items-center">
          <button onClick={onStart} className="text-orange-600 hover:text-orange-700 text-sm font-bold flex items-center gap-1">
            本文を読む・つづきから <ChevronRight size={16} />
          </button>
          <button onClick={onShowOnboarding} className="text-stone-400 hover:text-stone-600 text-sm underline transition-colors">
            使い方
          </button>
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  {
    icon: <MascotPinto expression="happy" size={110} />,
    title: `${UNIT.mascotName}といっしょに！`,
    body: UNIT.onboardingHello,
    color: 'bg-orange-50 border-orange-200',
    accent: 'text-orange-600',
  },
  {
    icon: <BookOpen size={80} className="text-emerald-500" />,
    title: `きょう読んだ${UNIT.sceneWord}をえらぼう`,
    body: `授業で読んだ${UNIT.sceneWord}をえらぶと、その${UNIT.sceneWord}の問題が「${SKILL_ORDER.map(s => SKILLS[s].label).join(' → ')}」の順に出てくるよ。「身につけたい力でえらぶ」から、力ごとに練習することもできるよ。`,
    color: 'bg-emerald-50 border-emerald-200',
    accent: 'text-emerald-600',
  },
  {
    icon: <MascotPinto expression="thinking" size={110} />,
    title: 'ヒントと「読み方のコツ」',
    body: `わからないときはヒントボタン。まちがえたときは、${UNIT.mascotName}が「読み方のコツ」を教えてくれるよ。`,
    color: 'bg-amber-50 border-amber-200',
    accent: 'text-amber-600',
  },
  {
    icon: <MascotPinto expression="serious" size={110} />,
    title: 'まとめテストで本気モード',
    body: `全部の${UNIT.sceneWord}から10問。ヒントなしのテストだよ。終わったら、どの力をもう一度練習するとよいかが分かるよ。`,
    color: 'bg-stone-100 border-stone-300',
    accent: 'text-stone-800',
  },
  {
    icon: <RotateCcw size={80} className="text-indigo-500" />,
    title: 'ふりかえりで完ぺきに',
    body: 'まちがえた問題は、次の日から「ふりかえり」に出てくるよ。日をあけてもう一度とくと、しっかり身につくよ。',
    color: 'bg-indigo-50 border-indigo-200',
    accent: 'text-indigo-600',
  },
] as const;

interface OnboardingProps {
  onDone: () => void;
}

export function OnboardingSlides({ onDone }: OnboardingProps) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col items-center gap-8">
        {/* Step indicator */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${i === idx ? 'w-8 bg-orange-500' : 'w-2 bg-stone-300'}`}
            />
          ))}
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className={`w-full rounded-3xl border-2 p-8 flex flex-col items-center gap-6 ${slide.color}`}
          >
            <div className="flex items-center justify-center h-28">{slide.icon}</div>
            <div className="text-center">
              <h2 className={`text-2xl font-black mb-3 ${slide.accent}`}>{slide.title}</h2>
              <p className="text-stone-600 leading-relaxed">{slide.body}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="w-full flex justify-between items-center">
          {idx > 0 ? (
            <button
              onClick={() => setIdx(i => i - 1)}
              className="flex items-center gap-1 text-stone-500 hover:text-stone-700 font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <ChevronLeft size={20} /> もどる
            </button>
          ) : (
            <div />
          )}

          {idx < SLIDES.length - 1 ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setIdx(i => i + 1)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              つぎへ <ChevronRight size={20} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onDone}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              はじめる！ <ChevronRight size={20} />
            </motion.button>
          )}
        </div>

        <button onClick={onDone} className="text-stone-400 hover:text-stone-600 text-sm underline transition-colors">
          スキップ
        </button>
      </div>
    </div>
  );
}
