/**
 * カバレッジ監査の汎用部分。「何通り出るか」と「どんな形が出るか」を数える。
 *
 * 0件の形は「たまたま出なかった」ではなく「設計上その形が作られない」シグナルなので
 * 失敗として扱う（guides/unit-test-coverage-audit-procedure）。
 * どの形を数えるか（checks）は単元固有なので、アプリ側が渡す。
 */
import type { Reporter } from './reporter.js';
import type { ProblemLike } from './checks.js';
import type { LevelLike, TestStepLike } from './structure.js';

export interface CollectArgs<P extends ProblemLike> {
  skillIds: readonly string[];
  generate(skillId: string): P;
  /** 1スキルあたりの生成回数（既定 4000。env N で上書き可） */
  n?: number;
  /** 各レベルに必要なバリエーション数（既定 20） */
  minVariations?: number;
}

/** 全スキルぶん生成してサンプルを集め、バリエーション数（signature の種類）を検査する */
export function collectSamples<P extends ProblemLike>(r: Reporter, a: CollectArgs<P>): Record<string, P[]> {
  const n = a.n ?? Number(process.env.N ?? 4000);
  const min = a.minVariations ?? 20;
  r.section(`バリエーション数（各レベル ${n} 回生成 / 目標 ${min} 通り以上）`);
  const samples: Record<string, P[]> = {};
  for (const skill of a.skillIds) {
    const list: P[] = [];
    const sigs = new Set<string>();
    for (let i = 0; i < n; i++) {
      const p = a.generate(skill);
      list.push(p);
      sigs.add(p.signature);
    }
    samples[skill] = list;
    const ok = sigs.size >= min;
    if (!ok) r.failures++;
    console.log(`  ${ok ? '✓' : '✗'} ${skill.padEnd(16)} ${String(sigs.size).padStart(5)} 通り`);
  }
  return samples;
}

/** 「どんな形が出るか」を、名前つきの述語で数える。0件は失敗 */
export function checkShapes<P extends ProblemLike>(
  r: Reporter,
  all: readonly P[],
  checks: Record<string, (p: P) => boolean>,
  title = '出題される「形」の監査（0件は設計上の欠落として失敗あつかい）',
): void {
  r.section(title);
  const width = Math.max(...Object.keys(checks).map((k) => k.length), 20);
  for (const [name, fn] of Object.entries(checks)) {
    const n = all.filter(fn).length;
    if (n === 0) r.failures++;
    console.log(`  ${n === 0 ? '✗' : '✓'} ${name.padEnd(width)} ${String(n).padStart(6)} 件`);
  }
}

/** 解答UIの種類がすべて出るか（数値入力だけで代用していないか） */
export function checkAnswerKinds<P extends ProblemLike>(
  r: Reporter,
  all: readonly P[],
  kinds: readonly string[],
): void {
  r.section('解答UIの種類');
  for (const k of kinds) {
    const n = all.filter((p) => p.answer.kind === k).length;
    if (n === 0) r.failures++;
    console.log(`  ${n === 0 ? '✗' : '✓'} ${k.padEnd(12)} ${String(n).padStart(6)} 件`);
  }
}

export interface TestPointsArgs {
  testSteps: readonly TestStepLike[];
  moduleLevels: Record<string, readonly LevelLike[]>;
  modules: readonly { id: string; title: string }[];
  totalMax: number;
}

/** 本番テストの配点（モジュール別）。1問も出ないモジュールは失敗 */
export function checkTestPoints(r: Reporter, a: TestPointsArgs): void {
  r.section('本番テストの配点（モジュール別）');
  const pts = new Map<string, number>();
  const modOf = (id: string) =>
    Object.entries(a.moduleLevels).find(([, ls]) => ls.some((l) => l.id === id))?.[0];
  for (const s of a.testSteps) {
    for (const id of s.pool) {
      const mod = modOf(id);
      if (!mod) continue;
      pts.set(mod, (pts.get(mod) ?? 0) + s.points / s.pool.length);
    }
  }
  for (const m of a.modules) {
    const v = pts.get(m.id) ?? 0;
    if (v === 0) {
      r.failures++;
      console.log(`  ✗ ${m.title.padEnd(14)} 0点（本番テストに1問も出ない）`);
    } else {
      console.log(`  ✓ ${m.title.padEnd(14)} ${v.toFixed(1).padStart(6)}点 (${((v / a.totalMax) * 100).toFixed(1)}%)`);
    }
  }
}
