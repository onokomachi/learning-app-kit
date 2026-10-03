import { useState, useEffect, useRef, useMemo, Fragment, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import {
  PawPrint, BookOpen, HelpCircle, PenTool, Layers, GitCompare,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Lightbulb, Star,
  Sprout, Flame, RotateCcw, Home, ClipboardCheck, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  pages, questions, kanjiList, structure, contrastChips, rubyMap,
  SKILLS, SKILL_ORDER, MISREADS,
  type Kanji, type Paragraph, type ContrastChip, type Question, type Skill
} from './data';
import { TitleScreen, OnboardingSlides } from './TitleScreen';
import { UNIT, SECTIONS, STRUCTURE, WHO_LABEL, CONTRAST } from './unit';
import { MascotPinto, SpeechBubble } from './Mascot';
import type { MascotExpression } from './Mascot';
import { syncToPortal } from './lib/portal';
import { noteCorrect, noteWrong, flushAbandoned, getHistory } from './lib/history';
import { forceSolo } from 'learning-app-kit/sync';
import { MarkStrip, type Mark } from './marks';

type Screen = 'title' | 'onboarding' | 'learn';
type Mode = 'read' | 'quiz' | 'kanji' | 'structure' | 'contrast';
type Cell = string;

interface WrongEntry {
  questionId: number;
  wrongCount: number;
  lastWrong: string; // YYYY-MM-DD
  cleared?: string;  // まちがえたあと、別の日に1回でできた日。ふりかえりから外す
}

type SessionKind = 'review' | 'test' | 'skill';

// 場面の区切り・人物の呼び名は単元ごとにちがうので unit.ts に置く
const SECTION_COLOR = (k: string) => SECTIONS[k]?.card ?? 'border-stone-300 bg-stone-50';
const SECTION_LABEL = (k: string) => SECTIONS[k]?.label ?? k;
const SECTION_BADGE = (k: string) => SECTIONS[k]?.badge ?? 'bg-stone-500 text-white';
const whoLabel = (k: string) => WHO_LABEL[k] ?? k;
const CELLS: Cell[] = CONTRAST.rows.flatMap(r => CONTRAST.cols.map(c => `${r.key}-${c.key}`));
const emptyCells = (): Record<Cell, number[]> => Object.fromEntries(CELLS.map(c => [c, []]));

// **〜** を太字にする（unit.ts の文章用）
function Bold({ text }: { text: string }) {
  return <>{text.split('**').map((t, i) => (i % 2 ? <strong key={i}>{t}</strong> : <span key={i}>{t}</span>))}</>;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

// 読みの力ごとの色（問題の上に出す小さな札）
const SKILL_CHIP: Record<Skill, string> = {
  kotoba: 'bg-sky-100 text-sky-700 border-sky-200',
  yousu: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  kimochi: 'bg-rose-100 text-rose-700 border-rose-200',
  henka: 'bg-violet-100 text-violet-700 border-violet-200',
  kangae: 'bg-amber-100 text-amber-700 border-amber-200',
};

// 場面の中では「ことば → ようす → 気持ち → うつりかわり → まとめ」の順に出す
const bySkill = (a: Question, b: Question) =>
  SKILL_ORDER.indexOf(a.skill) - SKILL_ORDER.indexOf(b.skill);

const TEST_SIZE = 10;
const LAST_TEST_KEY = `${UNIT.appId}_last_test_v1`;

// ぬき出しは3回まで（ふだん）。当てずっぽうに選び直し続けて当てる、を止める
const EXTRACT_MAX_TRIES = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// まとめテストの10問。紙の単元テストと同じく、どの場面からも出し、読みの力もかたよらせない。
// 前回のテストに出た問題は後回しにする（続けて受けても同じ問題にならない）。
// 記述は自分で見くらべる形なので、テストには入れない。
function buildTestQueue(): Question[] {
  let last: number[] = [];
  try { last = JSON.parse(localStorage.getItem(LAST_TEST_KEY) ?? '[]'); } catch { /* noop */ }
  const pool = questions.filter(q => q.type !== 'free');
  const fresh = shuffle(pool.filter(q => !last.includes(q.id)));
  const shuffled = [...fresh, ...shuffle(pool.filter(q => last.includes(q.id)))];
  const picked: Question[] = [];
  for (const p of pages) {
    const q = shuffled.find(x => x.pageId === p.id);
    if (q) picked.push(q);
  }
  const count = (s: Skill) => picked.filter(q => q.skill === s).length;
  const isLast = (q: Question) => (last.includes(q.id) ? 1 : 0);
  while (picked.length < Math.min(TEST_SIZE, pool.length)) {
    const rest = shuffled.filter(q => !picked.includes(q));
    // まだ少ない力の問題から先に足す。同じなら、前回出ていない問題を先に
    rest.sort((a, b) => count(a.skill) - count(b.skill) || isLast(a) - isLast(b));
    picked.push(rest[0]!);
  }
  try { localStorage.setItem(LAST_TEST_KEY, JSON.stringify(picked.map(q => q.id))); } catch { /* noop */ }
  return picked.sort((a, b) => a.pageId - b.pageId || bySkill(a, b));
}

// ぬき出しの答え合わせ。選びすぎ（本文をまるごと選ぶ等）・短すぎは不正解
function judgeExtract(q: Question, selected: string): 'ok' | 'long' | 'short' | 'wrong' {
  const answers = Array.isArray(q.answer) ? q.answer.map(a => a.trim()) : [];
  const sel = selected;
  if (q.charCount) return answers.some(a => sel.length === q.charCount && sel === a) ? 'ok' : 'wrong';
  for (const a of answers) {
    if (sel === a) return 'ok';
    // 正解の±20%（最低2文字）まで、境界のタップのずれとして許す
    const tolerance = Math.max(2, Math.ceil(a.length * 0.2));
    if (a.includes(sel) && sel.length >= a.length - tolerance) return 'ok';
    if (sel.includes(a) && sel.length <= a.length + tolerance) return 'ok';
  }
  const longest = Math.max(...answers.map(a => a.length));
  const shortest = Math.min(...answers.map(a => a.length));
  if (sel.length > longest + Math.max(2, Math.ceil(longest * 0.2))) return 'long';
  if (sel.length < Math.max(2, shortest - Math.max(2, Math.ceil(shortest * 0.2)))) return 'short';
  return 'wrong';
}

// 答えの文（テストでまちがえたときに見せる）
function answerText(q: Question): string {
  if (q.type === 'choice' && typeof q.answer === 'number') return q.choices?.[q.answer] ?? '';
  if (Array.isArray(q.answer)) return q.answer[0] ?? '';
  return '';
}

// 周回バッジ: 1=銀 2=金 3=プラチナ 4+=虹
function cycleBadge(cycle: number): { label: string; cls: string; icon: string } {
  if (cycle >= 4) return { label: `${cycle}周目`, cls: 'bg-gradient-to-r from-pink-400 via-yellow-400 to-sky-400 text-white border-pink-300', icon: '🌈' };
  if (cycle === 3) return { label: '3周目', cls: 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-800 border-slate-300', icon: '💎' };
  if (cycle === 2) return { label: '2周目', cls: 'bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-900 border-amber-400', icon: '🥇' };
  return { label: '1周目', cls: 'bg-gradient-to-r from-stone-200 to-stone-300 text-stone-700 border-stone-400', icon: '⭐' };
}

// 問題ごとのメダル: clearCount(累計周回正解数)に応じて段階表示
function questionMedal(count: number): { icon: string; label: string; cls: string } {
  if (count >= 3) return { icon: '🥇', label: `マスター（${count}周正解）`, cls: 'bg-amber-100 text-amber-700 border-amber-300' };
  if (count === 2) return { icon: '🥈', label: '上達中（2周正解）', cls: 'bg-slate-100 text-slate-700 border-slate-300' };
  if (count === 1) return { icon: '🥉', label: '挑戦ずみ（1周正解）', cls: 'bg-orange-100 text-orange-700 border-orange-300' };
  return { icon: '⭐', label: '新規', cls: 'bg-stone-100 text-stone-500 border-stone-300' };
}

export default function App() {
  // ── Screen routing ──────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('title');

  // ── Streak ──────────────────────────────────────────────────────────────────
  const [streak, setStreak] = useState(0);

  // ── Wrong log ───────────────────────────────────────────────────────────────
  const [wrongLog, setWrongLog] = useState<WrongEntry[]>([]);

  // ── Review mode ─────────────────────────────────────────────────────────────
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Question[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  // ふりかえり（まちがえた問題）か、まとめテストか
  const [sessionKind, setSessionKind] = useState<SessionKind>('review');
  const [sessionSkill, setSessionSkill] = useState<Skill | null>(null);
  const [testResults, setTestResults] = useState<Record<number, boolean>>({});
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [showTestResult, setShowTestResult] = useState(false);

  // ── Learning state ──────────────────────────────────────────────────────────
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('read');
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);

  const [customSelection, setCustomSelection] = useState<[number, number] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [solvedQuestions, setSolvedQuestions] = useState<number[]>([]);
  // この周の「ねばりクリア」（まちがえたあとに正解）と「ちょうせん中」（まちがえた）。solvedQuestions が一発クリア
  const [gritQuestions, setGritQuestions] = useState<number[]>([]);
  const [triedQuestions, setTriedQuestions] = useState<number[]>([]);
  const [clearCount, setClearCount] = useState<Record<number, number>>({});
  const [cycleCount, setCycleCount] = useState(1);
  const [showAllClear, setShowAllClear] = useState(false);
  const [showCycleUp, setShowCycleUp] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [lastChoice, setLastChoice] = useState<number | null>(null);
  const [wrongChoices, setWrongChoices] = useState<number[]>([]);
  const [extractTries, setExtractTries] = useState(0);
  const [extractNote, setExtractNote] = useState<'long' | 'short' | null>(null);
  // まちがえたあとの正解（メダルにならない）かどうか
  const [lateCorrect, setLateCorrect] = useState(false);
  const [selfCheck, setSelfCheck] = useState<'ok' | 'retry' | null>(null);

  // Structure mode
  const [expandedPara, setExpandedPara] = useState<number | null>(null);
  const [pulsePara, setPulsePara] = useState<number | null>(null);

  // Read mode (paragraph stepper)
  const [readParaNum, setReadParaNum] = useState<number>(1);

  // Contrast table mode
  const [placedChips, setPlacedChips] = useState<Record<Cell, number[]>>(emptyCells);
  const [selectedChipId, setSelectedChipId] = useState<number | null>(null);
  const [contrastFeedback, setContrastFeedback] = useState<{ cell: Cell; ok: boolean } | null>(null);

  // Mascot
  const [mascotExpression, setMascotExpression] = useState<MascotExpression>('default');
  const [mascotMessage, setMascotMessage] = useState('');
  const [mascotBubble, setMascotBubble] = useState(false);

  const textContainerRef = useRef<HTMLDivElement>(null);

  // Active question depends on mode
  const currentPage = pages[currentPageIndex];
  const pageQuestions = questions.filter(q => q.pageId === currentPage.id).sort(bySkill);
  const markOf = (id: number): Mark =>
    solvedQuestions.includes(id) ? 'ippatsu'
    : gritQuestions.includes(id) ? 'nebari'
    : triedQuestions.includes(id) ? 'trying'
    : 'none';
  const normalQuestion = pageQuestions[currentQuestionIndex];
  const currentQuestion: Question | undefined = reviewMode ? reviewQueue[reviewIdx] : normalQuestion;
  const isTest = reviewMode && sessionKind === 'test';
  // ぬき出しの答えを出しきった（テストは1回、ふだんは3回）
  const extractLocked = currentQuestion?.type === 'extract' && quizFeedback !== 'correct' &&
    (isTest ? quizFeedback !== null : extractTries >= EXTRACT_MAX_TRIES);

  // ── localStorage init ────────────────────────────────────────────────────────
  useEffect(() => {
    const savedSolved = localStorage.getItem('solvedQuestions');
    if (savedSolved) setSolvedQuestions(JSON.parse(savedSolved));

    try {
      setGritQuestions(JSON.parse(localStorage.getItem('gritQuestions') ?? '[]'));
      setTriedQuestions(JSON.parse(localStorage.getItem('triedQuestions') ?? '[]'));
    } catch { /* noop */ }
    const savedClearCount = localStorage.getItem('clearCount');
    if (savedClearCount) setClearCount(JSON.parse(savedClearCount));

    const savedCycle = localStorage.getItem('cycleCount');
    if (savedCycle) setCycleCount(parseInt(savedCycle, 10));

    const savedWrong = localStorage.getItem('wrongLog');
    if (savedWrong) setWrongLog(JSON.parse(savedWrong));

    const savedStreak = localStorage.getItem('streak');
    const savedLastDay = localStorage.getItem('lastLearnDay');
    const today = todayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (savedLastDay === today) {
      setStreak(savedStreak ? parseInt(savedStreak) : 1);
    } else if (savedLastDay === yesterday) {
      const newStreak = (savedStreak ? parseInt(savedStreak) : 0) + 1;
      setStreak(newStreak);
      localStorage.setItem('streak', String(newStreak));
      localStorage.setItem('lastLearnDay', today);
    } else {
      setStreak(1);
      localStorage.setItem('streak', '1');
      localStorage.setItem('lastLearnDay', today);
    }
  }, []);

  // ── Persist solved questions ─────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('solvedQuestions', JSON.stringify(solvedQuestions));
  }, [solvedQuestions]);
  useEffect(() => {
    localStorage.setItem('gritQuestions', JSON.stringify(gritQuestions));
    localStorage.setItem('triedQuestions', JSON.stringify(triedQuestions));
  }, [gritQuestions, triedQuestions]);

  // ── Persist clearCount & cycleCount ──────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('clearCount', JSON.stringify(clearCount));
  }, [clearCount]);
  useEffect(() => {
    localStorage.setItem('cycleCount', String(cycleCount));
  }, [cycleCount]);

  // ── Persist wrong log ────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('wrongLog', JSON.stringify(wrongLog));
  }, [wrongLog]);

  // ── 学級ポータルへ送る ───────────────────────────────────────────────────────
  // 端末への保存が正本で、ここは「先生に届ける」ためだけの副作用。
  // まとめて数秒後に1回だけ送られるので、状態が変わるたびに呼んでよい。
  // 環境変数が未設定なら何も起きない（従来どおり端末内だけで動く）。
  useEffect(() => {
    syncToPortal(clearCount, wrongLog, getHistory());
  }, [clearCount, wrongLog]);

  // できないまま別の設問へ移ったら、その問題を「とちゅうでやめた」として残す。
  // これが無いと、できなかった問題ほど記録から消える
  useEffect(() => {
    flushAbandoned(currentQuestion?.id);
  }, [currentQuestion?.id]);

  // 画面を閉じるときにも同じことをする
  useEffect(() => {
    const onLeave = () => flushAbandoned();
    window.addEventListener('pagehide', onLeave);
    return () => { window.removeEventListener('pagehide', onLeave); onLeave(); };
  }, []);

  // ── All-clear trigger ────────────────────────────────────────────────────────
  useEffect(() => {
    if (solvedQuestions.length === questions.length && questions.length > 0) {
      setShowAllClear(true);
    }
  }, [solvedQuestions.length]);

  // ── Pointer up ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  // ── Page / mode change: reset quiz state ────────────────────────────────────
  useEffect(() => {
    setQuizFeedback(null);
    setHintLevel(0);
    setFreeTextAnswer('');
    setShowSampleAnswer(false);
    setLastChoice(null);
    setWrongChoices([]);
    setExtractTries(0);
    setExtractNote(null);
    setLateCorrect(false);
    setSelfCheck(null);
    setSelectedKanji(null);
    setCurrentQuestionIndex(0);
    setCustomSelection(null);
    if (mode === 'read') {
      const currentPara = structure.find(p => p.num === readParaNum);
      if (!currentPara || currentPara.pageId !== pages[currentPageIndex].id) {
        const firstPara = structure.find(p => p.pageId === pages[currentPageIndex].id);
        if (firstPara) setReadParaNum(firstPara.num);
      }
    }
  }, [currentPageIndex, mode]);

  // ── Mascot helpers ──────────────────────────────────────────────────────────
  const showMascot = (expr: MascotExpression, msg: string) => {
    setMascotExpression(expr);
    setMascotMessage(msg);
    setMascotBubble(true);
    setTimeout(() => setMascotBubble(false), 3500);
  };

  // ── Answer helpers ──────────────────────────────────────────────────────────
  const recordCorrect = (questionId: number) => {
    // 時刻つきの記録。まちがえた回数もここで確定する
    noteCorrect(questionId);
    // きょうまちがえた問題は、選び直して当てても「できた」にしない。
    // 別の日にもう一度とけたときに初めてメダルになる（ふりかえりで日をあけて解き直す）
    const today = todayStr();
    const wrongToday = wrongLog.some(e => e.questionId === questionId && e.lastWrong === today);
    setLateCorrect(wrongToday);
    if (wrongToday) {
      // メダルにはしないが、あきらめずに正解したことは「ねばりクリア」として残す
      if (!solvedQuestions.includes(questionId)) {
        setGritQuestions(prev => prev.includes(questionId) ? prev : [...prev, questionId]);
      }
      showMascot('celebrating', 'ねばりクリア💪！あした一発で⭐をねらおう！');
      return;
    }
    const wasGrit = gritQuestions.includes(questionId);
    setWrongLog(prev => prev.map(e => e.questionId === questionId ? { ...e, cleared: today } : e));
    const isFirstSolveThisCycle = !solvedQuestions.includes(questionId);
    if (isFirstSolveThisCycle) {
      setSolvedQuestions(prev => [...prev, questionId]);
      // 周回ごとに1回しかclearCountを増やさない（連続正解で水増しできないように）
      setClearCount(prev => ({ ...prev, [questionId]: (prev[questionId] ?? 0) + 1 }));
    }
    const newCount = (clearCount[questionId] ?? 0) + (isFirstSolveThisCycle ? 1 : 0);
    const sceneDone = !reviewMode && isFirstSolveThisCycle &&
      pageQuestions.every(q => q.id === questionId || solvedQuestions.includes(q.id));
    const msg = sceneDone ? `この${UNIT.sceneWord}の問題、ぜんぶできた！`
      : wasGrit && isFirstSolveThisCycle ? 'こんどは一発！⭐にレベルアップ！'
      : !isFirstSolveThisCycle ? 'もう一度せいかい！しっかり身についてるね！'
      : newCount >= 3 ? `すごい！${newCount}周目せいかい！マスターだね！`
      : newCount === 2 ? 'よくできた！2周目もせいかい！'
      : 'すごい！正解！よくできたね！';
    showMascot('celebrating', msg);
  };

  const recordWrong = (questionId: number) => {
    // まだ記録しない。正解したときに「何回まちがえたか」として確定させる
    noteWrong(questionId);
    setTriedQuestions(prev => prev.includes(questionId) ? prev : [...prev, questionId]);
    const today = todayStr();
    setWrongLog(prev => {
      const existing = prev.find(e => e.questionId === questionId);
      if (existing) {
        return prev.map(e =>
          e.questionId === questionId
            ? { ...e, wrongCount: e.wrongCount + 1, lastWrong: today }
            : e
        );
      }
      return [...prev, { questionId, wrongCount: 1, lastWrong: today }];
    });
    showMascot('encouraging', isTest ? 'つぎの問題で取り返そう！' : 'おしい！ヒントを見てもう一度チャレンジ！');
  };

  // ── Review queue builder ─────────────────────────────────────────────────────
  const buildReviewQueue = (): Question[] => {
    const today = todayStr();
    return wrongLog
      .filter(e => e.lastWrong < today && !(e.cleared && e.cleared >= e.lastWrong))
      .map(e => questions.find(q => q.id === e.questionId))
      .filter((q): q is Question => q != null);
  };

  const reviewCount = buildReviewQueue().length;

  // まちがえた回数がいちばん多い「読みの力」。タイトル画面で「にがて」として知らせる
  const weakSkill: Skill | null = (() => {
    const tally = new Map<Skill, number>();
    for (const e of wrongLog) {
      const q = questions.find(x => x.id === e.questionId);
      if (q && !solvedQuestions.includes(q.id)) tally.set(q.skill, (tally.get(q.skill) ?? 0) + e.wrongCount);
    }
    let best: Skill | null = null;
    for (const [k, v] of tally) if (best === null || v > (tally.get(best) ?? 0)) best = k;
    return best;
  })();

  const resetQuizUi = () => {
    setQuizFeedback(null);
    setHintLevel(0);
    setFreeTextAnswer('');
    setShowSampleAnswer(false);
    setCustomSelection(null);
    setLastChoice(null);
    setWrongChoices([]);
    setExtractTries(0);
    setExtractNote(null);
    setLateCorrect(false);
    setSelfCheck(null);
  };

  const startSession = (kind: SessionKind, queue: Question[]) => {
    if (queue.length === 0) return;
    setSessionKind(kind);
    setReviewQueue(queue);
    setReviewIdx(0);
    setReviewMode(true);
    setMode('quiz');
    resetQuizUi();
    setScreen('learn');
  };

  const handleStartReview = () => {
    // にがてな力の問題から先に出す
    const queue = buildReviewQueue().sort((a, b) =>
      (a.skill === weakSkill ? 0 : 1) - (b.skill === weakSkill ? 0 : 1) || a.pageId - b.pageId);
    startSession('review', queue);
  };

  const handleStartTest = () => {
    // まとめテストは実力を測る場面。ペア（1台を2人）のままなら、ここでひとりに切り替える（算数の本番テストと同じ）
    forceSolo();
    const queue = buildTestQueue();
    setTestQuestions(queue);
    setTestResults({});
    startSession('test', queue);
    showMascot('serious', 'ここからは本気モードだ…！');
  };

  // 身につけたい力ごとに、全部の場面から順に出す
  const handleStartSkill = (skill: Skill) => {
    setSessionSkill(skill);
    startSession('skill', questions.filter(q => q.skill === skill).sort((a, b) => a.pageId - b.pageId || a.id - b.id));
  };

  // 授業で読んだ場面の問題から始める
  const handleStartScene = (pageIndex: number) => {
    setReviewMode(false);
    setCurrentPageIndex(pageIndex);
    setCurrentQuestionIndex(0);
    resetQuizUi();
    setMode('quiz');
    setScreen('learn');
  };

  const handleReviewNext = () => {
    if (reviewIdx < reviewQueue.length - 1) {
      setReviewIdx(i => i + 1);
      resetQuizUi();
      if (isTest) setMascotExpression('serious');
    } else {
      setReviewMode(false);
      setReviewQueue([]);
      resetQuizUi();
      if (isTest) {
        setShowTestResult(true);
      } else {
        showMascot('celebrating', sessionKind === 'skill' ? 'この力の問題、ひととおりできた！' : 'ふりかえり完了！よくがんばった！');
      }
    }
  };

  // テストの1回目の答えだけを結果に残す（やり直しで上書きしない）
  const noteTestResult = (questionId: number, ok: boolean) => {
    if (!isTest) return;
    setTestResults(prev => (questionId in prev ? prev : { ...prev, [questionId]: ok }));
  };

  const currentKanjiList = kanjiList.filter(k => k.pageId === currentPage.id);

  // ── Hint cycling ─────────────────────────────────────────────────────────────
  const handleHint = () => {
    if (!currentQuestion) return;
    if (hintLevel === 0) {
      setHintLevel(1);
      showMascot('thinking', 'ちょっとだけヒントだよ！');
    } else if (hintLevel === 1 && currentQuestion.hint2) {
      setHintLevel(2);
      showMascot('thinking', 'もうすこしくわしいヒントだよ！');
    } else {
      setHintLevel(3);
      showMascot('encouraging', '答えは本文の中にあるよ。よく読んでみて！');
    }
  };

  const getHintText = () => {
    if (!currentQuestion) return '';
    if (hintLevel === 1) return currentQuestion.hint;
    if (hintLevel === 2) return currentQuestion.hint2 ?? currentQuestion.hint;
    if (hintLevel === 3) {
      if (currentQuestion.targetText) return `本文の「${currentQuestion.targetText.slice(0, 8)}…」の近くを探してみよう。`;
      if (Array.isArray(currentQuestion.answer) && currentQuestion.answer.length > 0) {
        return `答えは${currentQuestion.answer[0].length}文字くらいだよ。`;
      }
      return currentQuestion.hint2 ?? currentQuestion.hint;
    }
    return '';
  };

  const hintLabel =
    hintLevel === 0 ? 'ヒント①を見る' :
    hintLevel === 1 ? 'ヒント②を見る' :
    hintLevel === 2 ? 'ヒント③を見る' : 'ヒントを見た';

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) setCurrentPageIndex(prev => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(prev => prev - 1);
  };
  const handleNextQuestion = () => {
    if (currentQuestionIndex < pageQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetQuizUi();
    }
  };
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      resetQuizUi();
    }
  };

  // ── Extract answer ──────────────────────────────────────────────────────────
  const getSelectedText = () => {
    if (!customSelection) return '';
    const start = Math.min(customSelection[0], customSelection[1]);
    const end = Math.max(customSelection[0], customSelection[1]);
    // For review mode, the question may belong to a different page
    const targetPage = reviewMode
      ? pages.find(p => p.id === currentQuestion?.pageId) ?? currentPage
      : currentPage;
    return Array.from(targetPage.text).slice(start, end + 1).join('');
  };

  const handleExtractAnswer = () => {
    if (extractLocked || quizFeedback === 'correct') return;
    const selectedText = getSelectedText().trim();
    if (!selectedText) {
      alert('本文の文字をタッチして選んでからボタンを押してね！');
      return;
    }
    if (currentQuestion?.type === 'extract' && Array.isArray(currentQuestion.answer)) {
      const verdict = judgeExtract(currentQuestion, selectedText);
      const isCorrect = verdict === 'ok';
      setExtractNote(verdict === 'long' || verdict === 'short' ? verdict : null);
      if (!isCorrect) setExtractTries(n => n + 1);
      setQuizFeedback(isCorrect ? 'correct' : 'incorrect');
      noteTestResult(currentQuestion.id, isCorrect);
      if (isCorrect) {
        recordCorrect(currentQuestion.id);
      } else {
        recordWrong(currentQuestion.id);
        if (hintLevel === 0 && !isTest) setHintLevel(1);
      }
    }
    setCustomSelection(null);
  };

  const handleChoiceAnswer = (choiceIndex: number) => {
    if (isTest && quizFeedback) return;
    if (quizFeedback === 'correct' || wrongChoices.includes(choiceIndex)) return;
    if (currentQuestion?.type === 'choice') {
      const isCorrect = currentQuestion.answer === choiceIndex;
      setQuizFeedback(isCorrect ? 'correct' : 'incorrect');
      setLastChoice(choiceIndex);
      // 同じまちがいを連打できないように、えらんだまちがいは押せなくする
      if (!isCorrect) setWrongChoices(prev => [...prev, choiceIndex]);
      noteTestResult(currentQuestion.id, isCorrect);
      if (isCorrect) {
        recordCorrect(currentQuestion.id);
      } else {
        recordWrong(currentQuestion.id);
        if (hintLevel === 0 && !isTest) setHintLevel(1);
      }
    }
  };

  // 記述は自動で採点できないので、解答例と「ポイント」を見くらべて自分で決める
  const handleFreeTextSubmit = () => {
    setShowSampleAnswer(true);
    setSelfCheck(null);
  };
  const handleSelfCheck = (ok: boolean) => {
    if (!currentQuestion || selfCheck) return;
    setSelfCheck(ok ? 'ok' : 'retry');
    if (ok) {
      recordCorrect(currentQuestion.id);
    } else {
      recordWrong(currentQuestion.id);
      showMascot('encouraging', 'ポイントを入れて、書き直してみよう！');
    }
  };

  const handleTouchMove = (e: ReactTouchEvent) => {
    if (!isDragging || mode !== 'quiz' || currentQuestion?.charCount) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.hasAttribute('data-index')) {
      const index = parseInt(element.getAttribute('data-index')!, 10);
      setCustomSelection(prev => prev ? [prev[0], index] : [index, index]);
    }
  };

  // ── Structure mode ──────────────────────────────────────────────────────────
  const handleSelectParagraph = (p: Paragraph) => {
    setExpandedPara(prev => (prev === p.num ? null : p.num));
    if (p.pageId !== currentPage.id) {
      setCurrentPageIndex(pages.findIndex(pg => pg.id === p.pageId));
    }
    setPulsePara(p.num);
    setTimeout(() => setPulsePara(null), 1200);
  };

  // ── Read mode ───────────────────────────────────────────────────────────────
  const readPara = structure.find(p => p.num === readParaNum) ?? structure[0];
  const readParaBody = (() => {
    const targetPage = pages.find(pg => pg.id === readPara.pageId);
    if (!targetPage) return '';
    const paragraphsOnPage = structure.filter(p => p.pageId === readPara.pageId);
    const idxInPage = paragraphsOnPage.findIndex(p => p.num === readPara.num);
    const segments = targetPage.text.split('\n');
    return segments[idxInPage] ?? '';
  })();

  const handleStepRead = (delta: 1 | -1) => {
    const next = readParaNum + delta;
    if (next < 1 || next > structure.length) return;
    const nextPara = structure.find(p => p.num === next)!;
    setReadParaNum(next);
    if (nextPara.pageId !== currentPage.id) {
      setCurrentPageIndex(pages.findIndex(pg => pg.id === nextPara.pageId));
    }
    setPulsePara(next);
    setTimeout(() => setPulsePara(null), 1200);
  };

  // ── Contrast table ──────────────────────────────────────────────────────────
  const handleSelectChip = (chip: ContrastChip) => {
    if ((Object.values(placedChips) as number[][]).some(arr => arr.includes(chip.id))) return;
    setSelectedChipId(prev => (prev === chip.id ? null : chip.id));
  };
  const handlePlaceChip = (cell: Cell) => {
    if (selectedChipId == null) return;
    const chip = contrastChips.find(c => c.id === selectedChipId);
    if (!chip) return;
    if (chip.correctCell === cell) {
      setPlacedChips(prev => ({ ...prev, [cell]: [...(prev[cell] ?? []), chip.id] }));
      setContrastFeedback({ cell, ok: true });
    } else {
      setContrastFeedback({ cell, ok: false });
    }
    setSelectedChipId(null);
    setTimeout(() => setContrastFeedback(null), 800);
  };
  const handleResetContrast = () => {
    setPlacedChips(emptyCells());
    setSelectedChipId(null);
    setContrastFeedback(null);
  };
  const contrastComplete = CELLS.every(c => (placedChips[c] ?? []).length === 1);

  // ── renderText ──────────────────────────────────────────────────────────────
  // In review mode we show the page the current review question belongs to
  const displayPage = reviewMode && currentQuestion
    ? (pages.find(p => p.id === currentQuestion.pageId) ?? currentPage)
    : currentPage;

  const renderText = () => {
    const text = displayPage.text;
    const chars = Array.from(text);

    const kanjiRanges: { start: number, end: number, kanji: Kanji }[] = [];
    if (mode === 'kanji') {
      currentKanjiList.forEach(k => {
        let startIndex = 0;
        while ((startIndex = text.indexOf(k.char, startIndex)) !== -1) {
          kanjiRanges.push({ start: startIndex, end: startIndex + k.char.length - 1, kanji: k });
          startIndex += k.char.length;
        }
      });
    }

    const questionTargetRanges: { start: number, end: number }[] = [];
    if ((mode === 'quiz' || reviewMode) && currentQuestion?.targetText) {
      let startIndex = 0;
      while ((startIndex = text.indexOf(currentQuestion.targetText, startIndex)) !== -1) {
        questionTargetRanges.push({
          start: startIndex, end: startIndex + currentQuestion.targetText.length - 1
        });
        startIndex += currentQuestion.targetText.length;
      }
    }

    let pulseRange: { start: number, end: number } | null = null;
    if (pulsePara != null) {
      const paragraphsOnPage = structure.filter(p => p.pageId === displayPage.id);
      const idxInPage = paragraphsOnPage.findIndex(p => p.num === pulsePara);
      if (idxInPage >= 0) {
        const segments = text.split('\n');
        if (idxInPage < segments.length) {
          let offset = 0;
          for (let i = 0; i < idxInPage; i++) offset += segments[i].length + 1;
          pulseRange = { start: offset, end: offset + segments[idxInPage].length - 1 };
        }
      }
    }

    const paraStarts = new Set<number>([0]);
    chars.forEach((ch, i) => { if (ch === '\n' && i + 1 < chars.length) paraStarts.add(i + 1); });

    return chars.flatMap((char, index): ReactNode[] => {
      if (char === '\n') return [<br key={`br-${index}`} />];

      const isSelected = customSelection &&
        index >= Math.min(customSelection[0], customSelection[1]) &&
        index <= Math.max(customSelection[0], customSelection[1]);
      const kanji = kanjiRanges.find(r => index >= r.start && index <= r.end);
      const isQuestionTarget = questionTargetRanges.some(r => index >= r.start && index <= r.end);
      const isPulse = pulseRange && index >= pulseRange.start && index <= pulseRange.end;

      let className = 'transition-colors duration-200 ';
      if (isSelected) {
        className += 'bg-amber-300 text-amber-900 rounded-sm ';
      } else if (kanji) {
        className += 'text-indigo-600 font-bold cursor-pointer border-b-2 border-indigo-400 pb-1 ';
      }
      if (isQuestionTarget) {
        className += 'underline decoration-red-500 decoration-[3px] underline-offset-4 ';
      }
      if (isPulse) {
        className += 'bg-amber-100 ';
      }

      const handlePointerDown = () => {
        if (mode === 'kanji') {
          if (kanji) setSelectedKanji(kanji.kanji);
          return;
        }
        if (mode === 'quiz' || reviewMode) {
          const charCount = currentQuestion?.charCount;
          if (charCount) {
            // 文字数指定: 1タップで charCount 文字分を自動選択
            const chars2 = Array.from(displayPage.text);
            const endIndex = Math.min(index + charCount - 1, chars2.length - 1);
            setCustomSelection([index, endIndex]);
            setIsDragging(false);
          } else {
            setIsDragging(true);
            if (customSelection && customSelection[0] === customSelection[1]) {
              setCustomSelection([customSelection[0], index]);
            } else {
              setCustomSelection([index, index]);
            }
          }
        }
      };

      const handlePointerEnter = () => {
        if (isDragging && !currentQuestion?.charCount && (mode === 'quiz' || reviewMode)) {
          setCustomSelection(prev => prev ? [prev[0], index] : [index, index]);
        }
      };

      const ruby = rubyMap[char];

      const inner = (
        <span
          key={index}
          data-index={index}
          className={className}
          onPointerDown={handlePointerDown}
          onPointerEnter={handlePointerEnter}
        >
          {char}
        </span>
      );

      const element: ReactNode = ruby ? (
        <ruby key={index} className="ruby-wrapper">
          {inner}
          <rt className="text-[0.5em] text-stone-500 font-normal">{ruby}</rt>
        </ruby>
      ) : inner;
      if (paraStarts.has(index)) {
        return [<span key={`ind-${index}`} aria-hidden>　</span>, element];
      }
      return [element];
    });
  };

  // ── Screen routing ──────────────────────────────────────────────────────────
  if (screen === 'title') {
    const masterCount = (Object.values(clearCount) as number[]).filter(c => c >= 3).length;
    return (
      <TitleScreen
        solvedCount={solvedQuestions.length}
        gritCount={gritQuestions.filter(id => !solvedQuestions.includes(id)).length}
        streak={streak}
        reviewCount={reviewCount}
        cycleCount={cycleCount}
        masterCount={masterCount}
        cycleBadgeInfo={cycleBadge(cycleCount)}
        weakSkillLabel={weakSkill ? SKILLS[weakSkill].label : null}
        sceneProgress={pages.map(p => {
          const qs = questions.filter(q => q.pageId === p.id);
          return { title: p.pageNumber, label: p.paragraphRange, solved: qs.filter(q => solvedQuestions.includes(q.id)).length, total: qs.length, marks: [...qs].sort(bySkill).map(q => markOf(q.id)) };
        })}
        onStart={() => { setReviewMode(false); setScreen('learn'); }}
        onStartScene={handleStartScene}
        onStartSkill={handleStartSkill}
        skillProgress={SKILL_ORDER.map(sk => {
          const qs = questions.filter(q => q.skill === sk);
          return { skill: sk, label: SKILLS[sk].label, desc: SKILLS[sk].desc, solved: qs.filter(q => solvedQuestions.includes(q.id)).length, total: qs.length, weak: sk === weakSkill, marks: qs.map(q => markOf(q.id)) };
        })}
        onStartTest={handleStartTest}
        onReview={handleStartReview}
        onShowOnboarding={() => setScreen('onboarding')}
      />
    );
  }

  if (screen === 'onboarding') {
    return <OnboardingSlides onDone={() => setScreen('learn')} />;
  }

  // ── Selected char count (for QuizBody display) ──────────────────────────────
  const selectedCharCount = customSelection ? getSelectedText().trim().length : 0;

  // ── Quiz panel helper: which question set to show ───────────────────────────
  const quizQuestion = currentQuestion;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-800">
      {/* まとめテストの結果 */}
      <AnimatePresence>
        {showTestResult && (
          <TestResult
            questions={testQuestions}
            results={testResults}
            onRedo={() => {
              setShowTestResult(false);
              startSession('review', testQuestions.filter(q => !testResults[q.id]));
            }}
            onClose={() => { setShowTestResult(false); setScreen('title'); }}
          />
        )}
      </AnimatePresence>

      {/* All Clear Modal */}
      <AnimatePresence>
        {showAllClear && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAllClear(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl max-w-md text-center"
              onClick={e => e.stopPropagation()}
            >
              <MascotPinto expression="celebrating" size={100} />
              <div className={`px-4 py-1.5 rounded-full font-bold text-sm border-2 ${cycleBadge(cycleCount).cls}`}>
                {cycleBadge(cycleCount).icon} {cycleBadge(cycleCount).label} クリア！
              </div>
              <div>
                <h2 className="text-3xl font-bold text-stone-800 mb-2">{cycleCount}周目クリア！</h2>
                <p className="text-stone-600">
                  すごい！この周回の全問題をクリアしたね！<br />
                  もう一周してマスター（{cycleCount >= 3 ? '4' : '3'}周正解）を目指そう！
                </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={() => {
                    setSolvedQuestions([]);
                    setGritQuestions([]);
                    setTriedQuestions([]);
                    setCycleCount(c => c + 1);
                    setShowAllClear(false);
                    setShowCycleUp(true);
                    setTimeout(() => setShowCycleUp(false), 2500);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg w-full"
                >
                  {cycleBadge(cycleCount + 1).icon} {cycleCount + 1}周目に進む！
                </button>
                <button
                  onClick={() => setShowAllClear(false)}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold py-2 px-8 rounded-full transition-colors text-sm w-full"
                >
                  あとで（このまま続ける）
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cycle-up toast */}
      <AnimatePresence>
        {showCycleUp && (
          <motion.div
            initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className={`px-6 py-3 rounded-full font-bold text-lg shadow-lg border-2 ${cycleBadge(cycleCount).cls}`}>
              {cycleBadge(cycleCount).icon} {cycleBadge(cycleCount).label} スタート！
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white shadow-sm px-3 py-2 flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setScreen('title')} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-500 shrink-0" aria-label="タイトルへ">
            <Home size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-stone-700 flex items-center gap-1.5 truncate">
              <PawPrint className="text-orange-500 shrink-0" size={18} aria-label="きつね" />
              {UNIT.title}
            </h1>
            <p className="text-[10px] text-stone-500 ml-6 truncate">{UNIT.author} ／ {UNIT.publisher}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-1 shrink-0">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full font-bold border-2 text-xs ${cycleBadge(cycleCount).cls}`} title={`現在 ${cycleBadge(cycleCount).label}`}>
              <span>{cycleBadge(cycleCount).icon}</span>
              <span>{cycleBadge(cycleCount).label}</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold border border-blue-200 text-xs">
              <span title="一発クリア">⭐{solvedQuestions.length}</span>
              <span title="ねばりクリア">💪{gritQuestions.filter(id => !solvedQuestions.includes(id)).length}</span>
              <span className="text-blue-400">/{questions.length}</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-0.5 text-orange-600 text-xs font-bold">
                <Flame size={12} className="text-orange-500" />
                <span>{streak}日</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {reviewMode && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${isTest ? 'bg-stone-800 text-white border-stone-800' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
              {isTest ? <ClipboardCheck size={12} /> : sessionKind === 'skill' ? <Target size={12} /> : <RotateCcw size={12} />}
              {reviewIdx + 1}/{reviewQueue.length}
            </div>
          )}
          <div className="flex gap-0.5 bg-stone-100 p-0.5 rounded-lg">
            <ModeButton active={mode === 'read'} onClick={() => { setReviewMode(false); setMode('read'); }} icon={<BookOpen size={16} />} label="読む" color="emerald" />
            <ModeButton active={mode === 'quiz' || reviewMode} onClick={() => { setReviewMode(false); setMode('quiz'); }} icon={<HelpCircle size={16} />} label="問題" color="amber" />
            <ModeButton active={mode === 'kanji'} onClick={() => { setReviewMode(false); setMode('kanji'); }} icon={<PenTool size={16} />} label="漢字" color="indigo" />
            <ModeButton active={mode === 'structure'} onClick={() => { setReviewMode(false); setMode('structure'); }} icon={<Layers size={16} />} label={UNIT.sceneWord} color="emerald" />
            <ModeButton active={mode === 'contrast'} onClick={() => { setReviewMode(false); setMode('contrast'); }} icon={<GitCompare size={16} />} label="対比" color="orange" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left: Text Viewer */}
        <div className="w-3/5 bg-white m-2 rounded-2xl shadow-sm border border-stone-200 flex flex-col relative">
          <div className="absolute top-2 left-3 text-stone-400 font-medium text-sm z-10">
            {displayPage.pageNumber}
          </div>
          <div className="absolute top-2 right-3 text-[10px] text-teal-600 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full z-10">
            {displayPage.paragraphRange}
          </div>

          <div className={`flex-1 overflow-x-auto px-5 pt-8 pb-2 block ${(mode === 'quiz' || reviewMode) ? 'select-none' : ''}`}>
            <div
              ref={textContainerRef}
              className="h-full min-h-[55vh] text-xl leading-[2.3] font-serif text-stone-800 ml-auto w-max px-5 cursor-text"
              style={{ writingMode: 'vertical-rl' }}
              onTouchMove={handleTouchMove}
            >
              {renderText()}
            </div>
          </div>

          <div className="px-3 py-2 border-t border-stone-100 flex justify-between items-center bg-stone-50 rounded-b-2xl">
            <button
              onClick={handleNextPage}
              disabled={currentPageIndex === pages.length - 1}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm disabled:opacity-50 hover:bg-stone-100 transition-colors font-bold text-stone-600 text-sm"
            >
              <ChevronLeft size={16} /> 次のページ
            </button>
            <div className="text-stone-400 font-medium text-sm">{currentPageIndex + 1} / {pages.length}</div>
            <button
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm disabled:opacity-50 hover:bg-stone-100 transition-colors font-bold text-stone-600 text-sm"
            >
              前のページ <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Action Panel */}
        <div className="w-2/5 m-2 ml-0 flex flex-col gap-2 relative">
          {/* Floating mascot — overlays panel content; bubble appears above to avoid pane-edge clipping */}
          <div className="absolute bottom-2 right-2 z-20 pointer-events-none">
            <div className="relative">
              <SpeechBubble message={mascotMessage} visible={mascotBubble} position="top" />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                <MascotPinto expression={mascotExpression} size={56} />
              </motion.div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={reviewMode ? `review-${reviewIdx}` : mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-200 p-4 pb-20 flex flex-col overflow-y-auto"
            >
              {/* Review mode panel */}
              {reviewMode && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-amber-100">
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${isTest ? 'text-stone-800' : 'text-amber-600'}`}>
                      {isTest
                        ? <><ClipboardCheck /> まとめテスト {reviewIdx + 1} / {reviewQueue.length}</>
                        : sessionKind === 'skill' && sessionSkill
                        ? <><Target /> {SKILLS[sessionSkill].label} {reviewIdx + 1} / {reviewQueue.length}</>
                        : <><RotateCcw /> ふりかえり問題 {reviewIdx + 1} / {reviewQueue.length}</>}
                    </h2>
                    {quizQuestion && (() => {
                      const cnt = clearCount[quizQuestion.id] ?? 0;
                      const solvedThisCycle = solvedQuestions.includes(quizQuestion.id);
                      const m = questionMedal(cnt);
                      if (cnt === 0 && !solvedThisCycle) return null;
                      return (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${m.cls}`}>
                          <span className="text-base">{m.icon}</span> {m.label}
                          {solvedThisCycle && <CheckCircle2 size={14} className="text-green-600" />}
                        </span>
                      );
                    })()}
                  </div>
                  {quizQuestion && <QuizBody
                    question={quizQuestion}
                    quizFeedback={quizFeedback}
                    hintLevel={hintLevel}
                    hintLabel={hintLabel}
                    hintText={getHintText()}
                    freeTextAnswer={freeTextAnswer}
                    showSampleAnswer={showSampleAnswer}
                    selectedCharCount={selectedCharCount}
                    testMode={isTest}
                    lastChoice={lastChoice}
                    wrongChoices={wrongChoices}
                    extractTries={extractTries}
                    extractLocked={extractLocked}
                    extractNote={extractNote}
                    lateCorrect={lateCorrect}
                    selfCheck={selfCheck}
                    onExtract={handleExtractAnswer}
                    onChoice={handleChoiceAnswer}
                    onFreeTextChange={setFreeTextAnswer}
                    onFreeTextSubmit={handleFreeTextSubmit}
                    onSelfCheck={handleSelfCheck}
                    onHint={handleHint}
                  />}
                  <div className="mt-4 pt-4 border-t border-amber-100 flex justify-end">
                    <button
                      onClick={handleReviewNext}
                      disabled={isTest && !quizFeedback}
                      className={`px-6 py-2 text-white font-bold rounded-full transition-colors flex items-center gap-1 disabled:opacity-40 ${isTest ? 'bg-stone-800 hover:bg-stone-900' : 'bg-amber-500 hover:bg-amber-600'}`}
                    >
                      {reviewIdx < reviewQueue.length - 1 ? '次の問題' : isTest ? '結果を見る' : sessionKind === 'skill' ? 'おわる' : 'ふりかえり完了'} <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {!reviewMode && mode === 'read' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-teal-100">
                    <h2 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                      <BookOpen /> {UNIT.sceneWord}ごとに読もう
                    </h2>
                    <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      {readParaNum} / {structure.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${SECTION_BADGE(readPara.section)}`}>
                      {SECTION_LABEL(readPara.section)}
                    </span>
                    <span className="text-sm font-bold text-stone-700">{readPara.role}</span>
                  </div>

                  <div className="flex-1 bg-stone-50 rounded-2xl border border-stone-200 p-5 overflow-y-auto leading-loose text-lg text-stone-800 font-serif">
                    {Array.from('　' + readParaBody).map((ch, i) => {
                      const r = rubyMap[ch];
                      if (r) {
                        return (
                          <ruby key={i}>
                            {ch}
                            <rt className="text-[0.5em] text-stone-500 font-normal">{r}</rt>
                          </ruby>
                        );
                      }
                      return <span key={i}>{ch}</span>;
                    })}
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={() => handleStepRead(-1)}
                      disabled={readParaNum === 1}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-emerald-200 rounded-full text-emerald-700 font-bold disabled:opacity-30 hover:bg-emerald-50"
                    >
                      <ChevronLeft size={18} /> 前の{UNIT.sceneWord}
                    </button>
                    <button
                      onClick={() => handleStepRead(1)}
                      disabled={readParaNum === structure.length}
                      className="flex items-center gap-1 px-4 py-2 bg-emerald-500 text-white rounded-full font-bold disabled:opacity-30 hover:bg-emerald-600"
                    >
                      次の{UNIT.sceneWord} <ChevronRight size={18} />
                    </button>
                  </div>

                  {readPara.feeling && (
                    <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm">
                      <div className="font-bold text-rose-600 mb-1 flex items-center gap-1">
                        <Sprout size={15} /> 読みどころ（{whoLabel(readPara.feeling.who)}）
                      </div>
                      <p className="text-stone-700">{readPara.feeling.point}</p>
                    </div>
                  )}
                </div>
              )}

              {!reviewMode && mode === 'quiz' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-amber-100">
                    <h2 className="text-xl font-bold text-amber-600 flex items-center gap-2">
                      <HelpCircle /> 問題 {currentQuestionIndex + 1} / {pageQuestions.length}
                    </h2>
                    {quizQuestion && (() => {
                      const cnt = clearCount[quizQuestion.id] ?? 0;
                      const solvedThisCycle = solvedQuestions.includes(quizQuestion.id);
                      const m = questionMedal(cnt);
                      if (cnt === 0 && !solvedThisCycle) return null;
                      return (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${m.cls}`}>
                          <span className="text-base">{m.icon}</span> {m.label}
                          {solvedThisCycle && <CheckCircle2 size={14} className="text-green-600" />}
                        </span>
                      );
                    })()}
                  </div>

                  <MarkStrip marks={pageQuestions.map(q => markOf(q.id))} current={currentQuestionIndex}
                    onPick={(i) => { if (i !== currentQuestionIndex) { setCurrentQuestionIndex(i); resetQuizUi(); } }} />

                  {quizQuestion ? (
                    <QuizBody
                      question={quizQuestion}
                      quizFeedback={quizFeedback}
                      hintLevel={hintLevel}
                      hintLabel={hintLabel}
                      hintText={getHintText()}
                      freeTextAnswer={freeTextAnswer}
                      showSampleAnswer={showSampleAnswer}
                      selectedCharCount={selectedCharCount}
                      testMode={false}
                      lastChoice={lastChoice}
                      wrongChoices={wrongChoices}
                      extractTries={extractTries}
                      extractLocked={extractLocked}
                      extractNote={extractNote}
                      lateCorrect={lateCorrect}
                      selfCheck={selfCheck}
                      onExtract={handleExtractAnswer}
                      onChoice={handleChoiceAnswer}
                      onFreeTextChange={setFreeTextAnswer}
                      onFreeTextSubmit={handleFreeTextSubmit}
                      onSelfCheck={handleSelfCheck}
                      onHint={handleHint}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-4">
                      <HelpCircle size={48} className="opacity-20" />
                      <p>このページには問題はありません。<br />次のページに進んでみよう。</p>
                    </div>
                  )}

                  {pageQuestions.length > 1 && (
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-amber-100">
                      <button
                        onClick={handlePrevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 text-amber-600 font-bold disabled:opacity-30 flex items-center gap-1 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <ChevronLeft size={20} /> 前の問題
                      </button>
                      <button
                        onClick={handleNextQuestion}
                        disabled={currentQuestionIndex === pageQuestions.length - 1}
                        className="px-4 py-2 text-amber-600 font-bold disabled:opacity-30 flex items-center gap-1 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        次の問題 <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!reviewMode && mode === 'kanji' && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-indigo-600 flex items-center gap-2 mb-3 pb-2 border-b border-indigo-100">
                    <PenTool /> 新出漢字を学ぼう
                  </h2>
                  <p className="text-stone-600 mb-6">左の文章のインディゴ色の文字をタップすると、漢字の読み方や意味がわかるよ。</p>
                  {selectedKanji ? (
                    <motion.div
                      key={selectedKanji.char}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-indigo-50 rounded-2xl p-8 border border-indigo-100 flex flex-col items-center text-center gap-5"
                    >
                      <div className="text-8xl font-serif text-indigo-900 bg-white w-40 h-40 rounded-2xl shadow-sm flex items-center justify-center border-2 border-indigo-200">
                        {selectedKanji.char}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-indigo-500 mb-1">読み方</div>
                        <div className="text-2xl font-bold text-stone-800">{selectedKanji.reading}</div>
                      </div>
                      <div className="w-full h-px bg-indigo-200" />
                      <div>
                        <div className="text-sm font-bold text-indigo-500 mb-1">意味</div>
                        <div className="text-lg text-stone-700">{selectedKanji.meaning}</div>
                      </div>
                      {selectedKanji.example && (
                        <>
                          <div className="w-full h-px bg-indigo-200" />
                          <div>
                            <div className="text-sm font-bold text-indigo-500 mb-1">本文での使い方</div>
                            <div className="text-lg text-stone-700">{selectedKanji.example}</div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/50 text-indigo-400 font-medium p-6 text-center">
                      左の文章からインディゴ色の漢字を選んでね<br />
                      （このページの新出漢字: {currentKanjiList.map(k => k.char).join('・') || 'なし'}）
                    </div>
                  )}
                </div>
              )}

              {!reviewMode && mode === 'structure' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-emerald-100">
                    <h2 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                      <Layers /> {STRUCTURE.title}
                    </h2>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">{STRUCTURE.tag}</span>
                  </div>
                  <p className="text-stone-600 mb-4 text-sm">
                    {STRUCTURE.intro}
                    {Object.values(SECTIONS).map((sec, i) => (
                      <span key={sec.label}>{i > 0 ? '・' : ''}<span className={`${sec.text} font-bold`}>{sec.label}</span></span>
                    ))}で色分けされているよ。
                  </p>
                  <div className="flex flex-col gap-3">
                    {structure.map(p => {
                      const tone = SECTION_COLOR(p.section);
                      const isExpanded = expandedPara === p.num;
                      return (
                        <button
                          key={p.num}
                          onClick={() => handleSelectParagraph(p)}
                          className={`text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${tone} ${isExpanded ? 'shadow-md ring-2 ring-emerald-300' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-stone-700 border border-stone-200 shrink-0">
                              {p.num}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SECTION_BADGE(p.section)}`}>{SECTION_LABEL(p.section)}</span>
                                <span className="font-bold text-stone-700">{p.role}</span>
                              </div>
                              <div className="text-sm text-stone-600">{p.summary}</div>
                              {isExpanded && p.feeling && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 flex flex-col gap-2">
                                  <div className="bg-white/80 rounded-lg p-2 border border-emerald-200">
                                    <div className="text-xs font-bold text-emerald-700 mb-1">読みどころ（{whoLabel(p.feeling.who)}）</div>
                                    <div className="text-xs text-stone-700">{p.feeling.point}</div>
                                  </div>
                                  <div className="bg-white/80 rounded-lg p-2 border border-amber-200">
                                    <div className="text-xs font-bold text-amber-700 mb-1">考えてみよう</div>
                                    <div className="text-xs text-stone-700">{p.feeling.deep}</div>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!reviewMode && mode === 'contrast' && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-orange-600 flex items-center gap-2 mb-3 pb-2 border-b border-orange-100">
                    <GitCompare /> {CONTRAST.title}
                  </h2>
                  <p className="text-stone-600 text-sm mb-4">
                    下の<strong>カード</strong>をタップ → <strong>表のマス</strong>をタップ で入れていこう。<br />
                    {CONTRAST.guide}
                  </p>

                  <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `auto repeat(${CONTRAST.cols.length}, minmax(0, 1fr))` }}>
                    <div></div>
                    {CONTRAST.cols.map(c => (
                      <div key={c.key} className={`text-center text-xs font-bold rounded-lg py-2 px-1 flex items-center justify-center whitespace-pre-line ${c.cls}`}>{c.label}</div>
                    ))}
                    {CONTRAST.rows.map(r => (
                      <Fragment key={r.key}>
                        <div className={`flex items-center justify-center text-sm font-bold rounded-lg px-2 text-center whitespace-pre-line ${r.cls}`}>{r.label}</div>
                        {CONTRAST.cols.map(c => (
                          <Fragment key={c.key}>
                            <Cell2x2 cell={`${r.key}-${c.key}`} border={c.border} placed={placedChips} chips={contrastChips} feedback={contrastFeedback} onPlace={handlePlaceChip} />
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-bold text-stone-500 mb-2">語句カード</div>
                    <div className="flex flex-wrap gap-2">
                      {contrastChips.map(chip => {
                        const placed = (Object.values(placedChips) as number[][]).some(arr => arr.includes(chip.id));
                        if (placed) return null;
                        const isSelected = selectedChipId === chip.id;
                        return (
                          <button
                            key={chip.id}
                            onClick={() => handleSelectChip(chip)}
                            className={`px-3 py-2 rounded-full text-sm font-medium border-2 transition-all ${isSelected ? 'bg-stone-800 text-white border-stone-800 scale-105' : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'}`}
                          >
                            {chip.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {contrastComplete && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-auto bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <p className="font-bold text-orange-700 mb-1">{CONTRAST.summaryTitle}</p>
                      <p className="text-stone-700 text-sm"><Bold text={CONTRAST.summary} /></p>
                    </motion.div>
                  )}

                  <button onClick={handleResetContrast} className="mt-4 text-stone-400 hover:text-stone-600 text-sm underline self-start">
                    リセットする
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ── QuizBody ─────────────────────────────────────────────────────────────────
function QuizBody({
  question,
  quizFeedback,
  hintLevel,
  hintLabel,
  hintText,
  freeTextAnswer,
  showSampleAnswer,
  selectedCharCount,
  testMode,
  lastChoice,
  wrongChoices,
  extractTries,
  extractLocked,
  extractNote,
  lateCorrect,
  selfCheck,
  onExtract,
  onChoice,
  onFreeTextChange,
  onFreeTextSubmit,
  onSelfCheck,
  onHint,
}: {
  question: Question;
  quizFeedback: 'correct' | 'incorrect' | null;
  hintLevel: 0 | 1 | 2 | 3;
  hintLabel: string;
  hintText: string;
  freeTextAnswer: string;
  showSampleAnswer: boolean;
  selectedCharCount: number;
  testMode: boolean;
  lastChoice: number | null;
  wrongChoices: number[];
  extractTries: number;
  extractLocked: boolean;
  extractNote: 'long' | 'short' | null;
  lateCorrect: boolean;
  selfCheck: 'ok' | 'retry' | null;
  onExtract: () => void;
  onChoice: (idx: number) => void;
  onFreeTextChange: (v: string) => void;
  onFreeTextSubmit: () => void;
  onSelfCheck: (ok: boolean) => void;
  onHint: () => void;
}) {
  // テストでは1回答えたら次へ。ふだんは何度でもやり直せる
  const locked = testMode && quizFeedback !== null;
  // 選択肢の並びは、出すたびに入れかえる（「答えは③」と位置で覚えてしまうのを防ぐ）
  const order = useMemo(
    () => shuffle((question.choices ?? []).map((_, i) => i)),
    [question.id], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // 答えを見せる：テストでまちがえたとき／ぬき出しを出しきったとき
  const showAnswer = (locked && quizFeedback === 'incorrect') || extractLocked;
  const misread = quizFeedback === 'incorrect' && question.type === 'choice' && lastChoice !== null
    ? question.misread?.[lastChoice] ?? null
    : null;
  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="flex items-center gap-2 -mb-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${SKILL_CHIP[question.skill]}`}>
          {SKILLS[question.skill].label}
        </span>
        <span className="text-xs text-stone-400">{pages.find(p => p.id === question.pageId)?.paragraphRange}</span>
      </div>
      <div className="bg-amber-50 p-6 rounded-xl text-lg font-medium text-stone-800 leading-relaxed whitespace-pre-line">
        {question.question}
      </div>

      {question.type === 'extract' && (
        <div className="flex flex-col gap-4 items-center justify-center">
          <div className="bg-amber-100/50 p-4 rounded-xl text-stone-600 text-center text-sm w-full">
            <p className="font-bold text-amber-700 mb-1">【えらび方】</p>
            {question.charCount ? (
              <p>
                左の文章の<strong>答えが始まる文字を1回タップ</strong>すると、<br />
                <span className="text-amber-600 font-bold">{question.charCount}文字分</span>が自動で選ばれるよ。
              </p>
            ) : (
              <p>左の文章の、<strong>最初の文字</strong>と<strong>最後の文字</strong>を<br />ポン、ポンとタッチして選んでね。</p>
            )}
          </div>

          {/* 選択中の文字数バッジ */}
          {selectedCharCount > 0 && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm border-2 ${
              question.charCount
                ? selectedCharCount === question.charCount
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-red-100 text-red-600 border-red-300'
                : 'bg-amber-100 text-amber-700 border-amber-300'
            }`}>
              <span>{selectedCharCount}文字選択中</span>
              {question.charCount && selectedCharCount !== question.charCount && (
                <span className="text-xs">（{question.charCount}文字にしてね）</span>
              )}
              {question.charCount && selectedCharCount === question.charCount && (
                <span className="text-xs">✓ ぴったり{question.charCount}文字！</span>
              )}
            </div>
          )}

          {!testMode && question.charCount === undefined && extractTries > 0 && !extractLocked && quizFeedback !== 'correct' && (
            <p className="text-xs text-stone-500">あと{EXTRACT_MAX_TRIES - extractTries}回 答えられるよ</p>
          )}
          <button
            onClick={onExtract}
            disabled={selectedCharCount === 0 || locked || extractLocked || quizFeedback === 'correct'}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg w-full max-w-md disabled:opacity-40"
          >
            選んだ文字で答える
          </button>
        </div>
      )}

      {question.type === 'choice' && (
        <div className="flex flex-col gap-3">
          {order.map((idx, pos) => {
            const choice = question.choices![idx]!;
            const picked = quizFeedback !== null && lastChoice === idx;
            const struck = wrongChoices.includes(idx);
            const tone = picked
              ? quizFeedback === 'correct' ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
              : struck ? 'border-stone-200 bg-stone-100 opacity-50'
              : 'border-stone-200 hover:border-amber-400 hover:bg-amber-50';
            return (
              <button
                key={idx}
                onClick={() => onChoice(idx)}
                disabled={locked || struck || quizFeedback === 'correct'}
                className={`text-left p-4 rounded-xl border-2 transition-colors font-medium text-stone-700 disabled:cursor-default ${tone}`}
              >
                <span className="text-stone-400 mr-1">{'①②③④'.charAt(pos)}</span>{choice}
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'free' && (
        <div className="flex flex-col gap-4">
          <textarea
            value={freeTextAnswer}
            onChange={(e) => onFreeTextChange(e.target.value)}
            placeholder="ここに自分の考えを書いてね..."
            className="min-h-[120px] p-4 rounded-xl border-2 border-stone-200 focus:border-amber-400 focus:ring-0 resize-none text-lg"
          />
          <button
            onClick={onFreeTextSubmit}
            disabled={!freeTextAnswer.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg disabled:opacity-50"
          >
            答え合わせをする
          </button>
          {showSampleAnswer && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-green-50 p-4 rounded-xl border border-green-200 flex flex-col gap-3">
              <div>
                <p className="text-green-800 font-bold mb-1">解答例</p>
                <p className="text-green-700">{question.sampleAnswer}</p>
              </div>
              {question.points && (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-green-800 font-bold text-sm mb-1">ここが書けていればOK</p>
                  <ul className="text-sm text-stone-700 list-none flex flex-col gap-1">
                    {question.points.map(pt => <li key={pt}>□ {pt}</li>)}
                  </ul>
                </div>
              )}
              {selfCheck === null ? (
                <div className="flex gap-2">
                  <button onClick={() => onSelfCheck(true)} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-full">書けた！</button>
                  <button onClick={() => onSelfCheck(false)} className="flex-1 bg-white border-2 border-green-300 text-green-700 font-bold py-2 rounded-full">もう少し</button>
                </div>
              ) : (
                <p className="text-sm font-bold text-green-700">
                  {selfCheck === 'ok' ? 'よし！ 次の問題へ進もう。' : '足りないポイントを入れて書き直したら、もう一度「答え合わせ」をおそう。'}
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {quizFeedback && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`p-4 rounded-xl flex items-center gap-3 font-bold text-lg ${quizFeedback === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {quizFeedback === 'correct' ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
          {quizFeedback === 'correct' ? '大正解！よくできました！' : testMode ? 'ざんねん！' : 'ざんねん、もう一度考えてみよう！'}
        </motion.div>
      )}

      {/* まちがえた選択肢の「読みまちがいの型」 */}
      {misread && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-800">
          <span className="font-bold">読み方のコツ：</span>{MISREADS[misread].advice}
        </div>
      )}

      {/* ぬき出しで、選び方そのものがずれているとき */}
      {quizFeedback === 'incorrect' && extractNote && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-800">
          <span className="font-bold">読み方のコツ：</span>
          {extractNote === 'long'
            ? '長く選びすぎだよ。問題にぴったり合う部分だけを選ぼう。'
            : '短すぎるよ。答えになる言葉を、切れ目まで選ぼう。'}
        </div>
      )}

      {/* まちがえたあとで当てた正解は、メダルにしない */}
      {quizFeedback === 'correct' && lateCorrect && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-sky-800">
          まちがえたあとの正解なので、メダルはまだだよ。あした以降の「ふりかえり」で、1回でとけたらもらえるよ。
        </div>
      )}

      {/* テストでまちがえたとき・ぬき出しを出しきったときは、答えを見せて次へ */}
      {showAnswer && (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-3 text-sm text-stone-700">
          {extractLocked && !testMode && <p className="font-bold mb-1">{EXTRACT_MAX_TRIES}回まちがえたので、答えをたしかめて、本文を読み直そう。</p>}
          <span className="font-bold">答え：</span>{answerText(question)}
        </div>
      )}

      {/* Tiered hint */}
      {!testMode && !extractLocked && hintLevel > 0 && hintText && (
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 text-indigo-800">
          <Lightbulb className="shrink-0 text-indigo-500 mt-1" />
          <div>
            <p className="font-bold text-indigo-600 text-xs mb-1">ヒント{'①②③'.charAt(hintLevel - 1)}</p>
            <p>{hintText}</p>
          </div>
        </div>
      )}

      {!testMode && !extractLocked && quizFeedback !== 'correct' && hintLevel < 3 && (
        <button
          onClick={onHint}
          className="flex items-center gap-2 self-start text-indigo-500 hover:text-indigo-700 text-sm font-bold border border-indigo-200 hover:border-indigo-400 rounded-full px-4 py-2 transition-colors"
        >
          <Lightbulb size={16} />
          {hintLabel}
        </button>
      )}
    </div>
  );
}

// ── TestResult ───────────────────────────────────────────────────────────────
// まとめテストの結果。点数や割合ではなく「読みの力ごとに、いくつできたか」と
// 「つぎに何をするか」を出す（学級ポータル全体の方針）。
function TestResult({
  questions: qs, results, onRedo, onClose,
}: {
  questions: Question[];
  results: Record<number, boolean>;
  onRedo: () => void;
  onClose: () => void;
}) {
  const done = qs.filter(q => results[q.id]).length;
  const wrong = qs.filter(q => !results[q.id]);
  const rows = SKILL_ORDER
    .map(s => ({ s, total: qs.filter(q => q.skill === s).length, ok: qs.filter(q => q.skill === s && results[q.id]).length }))
    .filter(r => r.total > 0);
  const weak = rows.filter(r => r.ok < r.total).sort((a, b) => (a.ok / a.total) - (b.ok / b.total))[0];
  const weakScenes = [...new Set(wrong.map(q => pages.find(p => p.id === q.pageId)?.paragraphRange))].filter(Boolean);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 flex flex-col items-center gap-4 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <MascotPinto expression={wrong.length === 0 ? 'celebrating' : 'happy'} size={96} />
        <h2 className="text-2xl font-black text-stone-800">まとめテスト おわり！</h2>
        <p className="text-stone-600">{qs.length}問中 <span className="font-black text-orange-600 text-xl">{done}問</span> できたよ</p>

        <div className="w-full flex flex-col gap-2">
          {rows.map(r => (
            <div key={r.s} className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-full border w-36 text-center shrink-0 ${SKILL_CHIP[r.s]}`}>{SKILLS[r.s].label}</span>
              <span className="flex gap-1">
                {Array.from({ length: r.total }, (_, i) => (
                  <span key={i} className={`w-5 h-5 rounded-full border-2 ${i < r.ok ? 'bg-orange-400 border-orange-400' : 'border-stone-300'}`} />
                ))}
              </span>
            </div>
          ))}
        </div>

        {weak ? (
          <div className="w-full bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-stone-700">
            <p className="font-bold text-orange-700 mb-1">つぎにやること</p>
            <p>「{SKILLS[weak.s].label}」の問題をもう一度。{SKILLS[weak.s].desc}ようになろう。</p>
            {weakScenes.length > 0 && <p className="mt-1">読み直すとよい{UNIT.sceneWord}：{weakScenes.join('・')}</p>}
          </div>
        ) : (
          <p className="text-sm font-bold text-emerald-600">ぜんぶできた！ テストもばっちりだね。</p>
        )}

        <div className="w-full flex flex-col gap-2">
          {wrong.length > 0 && (
            <button onClick={onRedo} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-full">
              まちがえた{wrong.length}問を、ヒントつきでやり直す
            </button>
          )}
          <button onClick={onClose} className="w-full bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold py-2 rounded-full text-sm">
            タイトルへもどる
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Cell2x2 ──────────────────────────────────────────────────────────────────
function Cell2x2({
  cell, border, placed, chips, feedback, onPlace
}: {
  cell: Cell;
  border: string;
  placed: Record<Cell, number[]>;
  chips: ContrastChip[];
  feedback: { cell: Cell; ok: boolean } | null;
  onPlace: (cell: Cell) => void;
}) {
  const chipId = (placed[cell] ?? [])[0];
  const chip = chipId != null ? chips.find(c => c.id === chipId) : null;
  const fb = feedback && feedback.cell === cell ? feedback : null;
  const baseColor = border;
  const flash =
    fb?.ok === false ? 'bg-red-200 border-red-400 animate-pulse' :
    fb?.ok === true ? 'bg-green-100 border-green-400' :
    chip ? 'bg-white border-stone-300' : 'bg-stone-50';
  return (
    <button
      onClick={() => onPlace(cell)}
      className={`min-h-[64px] rounded-xl border-2 p-2 text-xs transition-all ${baseColor} ${flash}`}
    >
      {chip ? (
        <span className="text-stone-700 font-medium">{chip.text}</span>
      ) : (
        <span className="text-stone-400">タップして入れる</span>
      )}
    </button>
  );
}

// ── ModeButton ───────────────────────────────────────────────────────────────
function ModeButton({
  active, onClick, icon, label, color
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  color: 'emerald' | 'amber' | 'indigo' | 'orange';
}) {
  const colorMap: Record<typeof color, string> = {
    emerald: 'bg-emerald-500 text-white shadow-md',
    amber: 'bg-amber-500 text-white shadow-md',
    indigo: 'bg-indigo-500 text-white shadow-md',
    orange: 'bg-orange-500 text-white shadow-md',
  };
  const inactiveColorMap: Record<typeof color, string> = {
    emerald: 'text-emerald-700 hover:bg-emerald-100',
    amber: 'text-amber-700 hover:bg-amber-100',
    indigo: 'text-indigo-700 hover:bg-indigo-100',
    orange: 'text-orange-700 hover:bg-orange-100',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm transition-all ${active ? colorMap[color] : inactiveColorMap[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}
