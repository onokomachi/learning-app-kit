/**
 * アプリ構成の整合性検査（レベル定義・本番テスト構成）。
 *
 *  - 本番テストに一度も出ないレベルが無いか
 *  - 表・裏の満点が想定どおりか、丸数字（設問の sub）に重複が無いか
 *  - レベル定義の重複、画面に出ないレベル、moduleId と skillId 接頭辞の不一致
 *    （bugs/label-implementation-mismatch-and-unused-components）
 */
import type { Reporter } from './reporter.js';

export interface LevelLike {
  id: string;
  label?: string;
}

export interface TestStepLike {
  sub?: string;
  section: string;
  points: number;
  pool: readonly string[];
}

export interface StructureArgs {
  skillIds: readonly string[];
  moduleLevels: Record<string, readonly LevelLike[]>;
  generate(skillId: string): { moduleId?: string };
  testSteps?: readonly TestStepLike[];
  /** 本番テストに含まれていないスキル（アプリ側の関数）。無ければ testSteps.pool から計算 */
  skillsMissingFromTest?: () => string[];
  /** セクション名 → 期待する満点。例: { 表: 100, 裏: 50 } */
  expectedSectionMax?: Record<string, number>;
}

export function checkStructure(r: Reporter, a: StructureArgs): void {
  if (a.testSteps) {
    r.section('本番テスト構成のチェック');
    const missing = a.skillsMissingFromTest
      ? a.skillsMissingFromTest()
      : a.skillIds.filter((id) => !a.testSteps!.some((s) => s.pool.includes(id)));
    r.assert(
      missing.length === 0,
      `実装した ${a.skillIds.length} レベルすべてが出題プールに入っている`,
      `本番テストに一度も出ないレベルがある: ${missing.join(', ')}`,
    );
    for (const [section, max] of Object.entries(a.expectedSectionMax ?? {})) {
      const total = a.testSteps.filter((s) => s.section === section).reduce((s, x) => s + x.points, 0);
      r.assert(total === max, `${section}＝${max}点`, `${section}の満点が ${max} でない: ${total}`);
    }
    const subs = a.testSteps.map((s) => s.sub).filter((s): s is string => !!s);
    r.assert(
      new Set(subs).size === subs.length,
      `設問 ${a.testSteps.length} 問（丸数字に重複なし）`,
      '丸数字が重複している',
    );
  }

  r.section('レベル定義のチェック');
  const defined = Object.values(a.moduleLevels).flat().map((l) => l.id);
  const dup = defined.filter((id, i) => defined.indexOf(id) !== i);
  r.assert(dup.length === 0, 'レベル定義に重複なし', `レベル定義が重複: ${dup.join(', ')}`);
  const notDefined = a.skillIds.filter((id) => !defined.includes(id));
  r.assert(
    notDefined.length === 0,
    '実装した全レベルが モジュールのレベル一覧に出ている',
    `画面に出ないレベル: ${notDefined.join(', ')}`,
  );
  let mismatch = 0;
  for (const [mod, levels] of Object.entries(a.moduleLevels)) {
    for (const l of levels) {
      const p = a.generate(l.id);
      if (p.moduleId !== undefined && p.moduleId !== mod) {
        mismatch++;
        console.error(`  ✗ ${l.id} の moduleId が ${p.moduleId}（期待: ${mod}）`);
      }
    }
  }
  if (mismatch > 0) r.failures += mismatch;
  else r.ok('moduleId と レベルの所属が一致');
}
