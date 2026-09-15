/**
 * 自動生成されたカタログ: 倍の見方
 *
 * 手で編集しないこと。アプリ側のレベル定義が正本で、scripts/gen-catalog.ts で再生成する。
 */
import type { AppCatalog } from './types.js';

export const bai: AppCatalog = {
  "app_id": "bai",
  "title": "倍の見方",
  "subject": "算数",
  "grade": 4,
  "url": "https://syo4-bainomikata.vercel.app",
  "generated_at": "2026-09-15",
  "skill_count": 15,
  "modules": [
    {
      "module_id": "base",
      "title": "もとにする量",
      "skills": [
        {
          "skill_id": "base-basic",
          "label": "かんたんな 数で",
          "desc": "くらべられる量 ÷ 倍（2〜9）",
          "answer_kind": "?"
        },
        {
          "skill_id": "base-big",
          "label": "大きな 数で",
          "desc": "テストの大問3のような 大きい数で",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "compare",
      "title": "何倍かにあたる量",
      "skills": [
        {
          "skill_id": "compare-basic",
          "label": "かんたんな 数で",
          "desc": "もとにする量 × 倍（2〜9）",
          "answer_kind": "?"
        },
        {
          "skill_id": "compare-big",
          "label": "大きな 数で",
          "desc": "テストの大問2のような 大きい数で",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "kihon",
      "title": "基礎：倍の見方",
      "skills": [
        {
          "skill_id": "kihon-find-compare",
          "label": "比較量を もとめる",
          "desc": "もとにする量 × 倍 ＝ くらべられる量",
          "answer_kind": "?"
        },
        {
          "skill_id": "kihon-find-times",
          "label": "倍を もとめる",
          "desc": "くらべられる量 ÷ もとにする量 ＝ 倍",
          "answer_kind": "?"
        },
        {
          "skill_id": "kihon-find-base",
          "label": "基準量を もとめる",
          "desc": "くらべられる量 ÷ 倍 ＝ もとにする量",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "ratio-compare",
      "title": "割合で くらべる",
      "skills": [
        {
          "skill_id": "ratio-compare-basic",
          "label": "どちらが 何倍か",
          "desc": "ゴムA・Bの のびを 倍で くらべよう",
          "answer_kind": "?"
        },
        {
          "skill_id": "ratio-compare-diff",
          "label": "差ではなく 倍で",
          "desc": "差は 同じでも 倍で くらべると ちがう！",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "times",
      "title": "何倍かを もとめる",
      "skills": [
        {
          "skill_id": "times-basic",
          "label": "かんたんな 数で",
          "desc": "倍が 2〜9で ぴったり わりきれる",
          "answer_kind": "?"
        },
        {
          "skill_id": "times-big",
          "label": "大きな 数で",
          "desc": "テストの大問1のような 2〜3けたの 数で",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "word-problem",
      "title": "ことばの もんだい",
      "skills": [
        {
          "skill_id": "wp-times",
          "label": "何倍かを もとめる",
          "desc": "くらべられる量 ÷ もとにする量",
          "answer_kind": "?"
        },
        {
          "skill_id": "wp-compare",
          "label": "比較量を もとめる",
          "desc": "もとにする量 × 倍",
          "answer_kind": "?"
        },
        {
          "skill_id": "wp-base",
          "label": "基準量を もとめる",
          "desc": "くらべられる量 ÷ 倍",
          "answer_kind": "?"
        },
        {
          "skill_id": "wp-ratio",
          "label": "割合で くらべる",
          "desc": "2つの ものを 倍で くらべよう",
          "answer_kind": "?"
        }
      ]
    }
  ],
  "misconceptions": []
};
