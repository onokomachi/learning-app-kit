/**
 * 自動生成されたカタログ: 比
 *
 * 手で編集しないこと。アプリ側の MODULE_LEVELS / coverage-audit.ts が正本で、
 * scripts/gen-catalog.ts で再生成する。
 */
import type { AppCatalog } from './types.js';

export const hitosono: AppCatalog = {
  "app_id": "hitosono",
  "title": "比",
  "subject": "算数",
  "grade": 6,
  "url": "https://syo6-hitosonoriyou.vercel.app",
  "generated_at": "2026-10-11",
  "skill_count": 23,
  "modules": [
    {
      "module_id": "mean",
      "title": "比の 表し方と 比の値",
      "skills": [
        {
          "skill_id": "mean-write",
          "label": "① 2つの量を 比で 表す",
          "desc": "「A と B の 比」は A：B の じゅんばんで 書くよ",
          "answer_kind": "choice"
        },
        {
          "skill_id": "mean-order",
          "label": "② じゅんばんに 気をつけて 表す",
          "desc": "「B と A の 比」は B：A。さかさまに しない！",
          "answer_kind": "choice"
        },
        {
          "skill_id": "mean-tape",
          "label": "③ テープ図から 比を 読む",
          "desc": "ますの 数の くらべで 比に 表そう",
          "answer_kind": "choice"
        },
        {
          "skill_id": "mean-val",
          "label": "④ 比の値を 求める",
          "desc": "比の値は 前の数 ÷ 後ろの数",
          "answer_kind": "frac"
        }
      ]
    },
    {
      "module_id": "eq",
      "title": "等しい比",
      "skills": [
        {
          "skill_id": "eq-val",
          "label": "① 比の値で 等しい比を えらぶ",
          "desc": "比の値が 同じなら 等しい比。差が 同じでは ダメ！",
          "answer_kind": "choice"
        },
        {
          "skill_id": "eq-judge",
          "label": "② 2つの比は 等しい？",
          "desc": "前と後ろの 両方に 同じ数を かけて（わって）いるかな",
          "answer_kind": "choice"
        },
        {
          "skill_id": "eq-make",
          "label": "③ 同じ数を かけて 等しい比を つくる",
          "desc": "前も 後ろも □倍に すると？",
          "answer_kind": "number"
        },
        {
          "skill_id": "eq-fill",
          "label": "④ □に 入る数を 求める",
          "desc": "何倍（何分の1）に なっているかを 見つけよう",
          "answer_kind": "number"
        }
      ]
    },
    {
      "module_id": "simp",
      "title": "比を 簡単にする",
      "skills": [
        {
          "skill_id": "simp-int",
          "label": "① 整数の 比を 簡単にする",
          "desc": "前と後ろを 同じ数で われるだけ わろう",
          "answer_kind": "ratio"
        },
        {
          "skill_id": "simp-dec",
          "label": "② 小数の 比を 簡単にする",
          "desc": "10倍（100倍）して 整数に してから",
          "answer_kind": "ratio"
        },
        {
          "skill_id": "simp-frac",
          "label": "③ 分数の 比を 簡単にする",
          "desc": "分母の 最小公倍数を かけて 整数に しよう",
          "answer_kind": "ratio"
        },
        {
          "skill_id": "simp-unit",
          "label": "④ 単位が ちがう 比を 簡単にする",
          "desc": "単位を そろえてから 簡単に しよう",
          "answer_kind": "ratio"
        }
      ]
    },
    {
      "module_id": "draw",
      "title": "テープ図に かく",
      "skills": [
        {
          "skill_id": "draw-unit",
          "label": "① 比の とおりに テープを 分ける",
          "desc": "2：3 なら 2ます と 3ます",
          "answer_kind": "split"
        },
        {
          "skill_id": "draw-split",
          "label": "② 大きな 全体を 比で 分ける",
          "desc": "1ますが 何こ分かを 考えて 線を 引こう",
          "answer_kind": "split"
        }
      ]
    },
    {
      "module_id": "use",
      "title": "比を 使う",
      "skills": [
        {
          "skill_id": "use-other",
          "label": "① 一方から もう一方を 求める",
          "desc": "5：7 の 7 が 140 なら 5 は？",
          "answer_kind": "choice+number"
        },
        {
          "skill_id": "use-split",
          "label": "② 全体を 比で 分ける",
          "desc": "1200mL を 3：5 で 分けると？",
          "answer_kind": "number"
        },
        {
          "skill_id": "use-compare",
          "label": "③ 比の値で くらべる",
          "desc": "どちらが こい？ 比の値を くらべよう",
          "answer_kind": "choice"
        },
        {
          "skill_id": "use-scale",
          "label": "④ 長方形の 拡大・縮小",
          "desc": "縦：横 の 比を 同じに して 大きさを 変える",
          "answer_kind": "choice+number"
        }
      ]
    },
    {
      "module_id": "eh",
      "title": "エラーハンター",
      "skills": [
        {
          "skill_id": "eh-additive",
          "label": "① 差で 考えた まちがい",
          "desc": "前に 3 たしたから 後ろにも 3 たす…？",
          "answer_kind": "choice+number"
        },
        {
          "skill_id": "eh-order",
          "label": "② じゅんばんを まちがえた",
          "desc": "B：A と A：B を とりちがえて いない？",
          "answer_kind": "choice+frac"
        },
        {
          "skill_id": "eh-whole",
          "label": "③ 全体と 一部を まちがえた",
          "desc": "3：5 の 全体は 3ではなく 8 こ分",
          "answer_kind": "choice+number"
        },
        {
          "skill_id": "eh-oneside",
          "label": "④ 片方だけ かけた・わった",
          "desc": "前だけ 2倍に しても 等しい比に ならない",
          "answer_kind": "choice+ratio"
        },
        {
          "skill_id": "eh-simp",
          "label": "⑤ 簡単にする 手順の まちがい",
          "desc": "まだ 簡単に できる・分数の 比の 取りちがえ",
          "answer_kind": "choice+ratio"
        }
      ]
    }
  ],
  "misconceptions": [
    {
      "code": "誤概念①",
      "label": "差で考える（加法的方略）。前を 3 ふやしたから 後ろも 3 ふやす",
      "skills": [
        "eq-val",
        "eq-judge",
        "eq-make",
        "eq-fill",
        "use-other",
        "use-scale",
        "eh-additive"
      ]
    },
    {
      "code": "誤概念②",
      "label": "比の じゅんばんを とりちがえる（B：A と A：B、比の値の 前後が ぎゃく）",
      "skills": [
        "mean-write",
        "mean-order",
        "mean-tape",
        "mean-val",
        "eh-order"
      ]
    },
    {
      "code": "誤概念③",
      "label": "全体と 一部を まぜる（3：5 の 全体は 3 でも 5 でもなく 8 こ分）",
      "skills": [
        "mean-tape",
        "draw-unit",
        "draw-split",
        "use-split",
        "eh-whole"
      ]
    },
    {
      "code": "誤概念④",
      "label": "片方だけに かける・わる、別々の 数を かける（前と後ろに 同じ数）",
      "skills": [
        "eq-judge",
        "eq-make",
        "eq-fill",
        "simp-int",
        "eh-oneside"
      ]
    },
    {
      "code": "誤概念⑤",
      "label": "簡単にする 途中で とまる／小数・分数・単位を そろえずに 計算する",
      "skills": [
        "simp-int",
        "simp-dec",
        "simp-frac",
        "simp-unit",
        "eh-simp"
      ]
    }
  ]
};
