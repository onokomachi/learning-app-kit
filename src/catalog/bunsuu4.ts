/**
 * 自動生成されたカタログ: 分数（1より大きい分数）
 *
 * 手で編集しないこと。アプリ側の MODULE_LEVELS / coverage-audit.ts が正本で、
 * scripts/gen-catalog.ts で再生成する。
 */
import type { AppCatalog } from './types.js';

export const bunsuu4: AppCatalog = {
  "app_id": "bunsuu4",
  "title": "分数（1より大きい分数）",
  "subject": "算数",
  "grade": 4,
  "url": "https://syo4-bunnsu.vercel.app",
  "generated_at": "2026-10-15",
  "skill_count": 40,
  "modules": [
    {
      "module_id": "hyo",
      "title": "1より大きい分数",
      "skills": [
        {
          "skill_id": "hyo-kind",
          "label": "真分数・仮分数・帯分数",
          "desc": "どの 分数か 見分けよう",
          "answer_kind": "choice"
        },
        {
          "skill_id": "hyo-unit",
          "label": "何こ分？",
          "desc": "4分の7 は 4分の1 の 7こ分",
          "answer_kind": "frac"
        },
        {
          "skill_id": "hyo-tape",
          "label": "テープと 水の かさ",
          "desc": "目もりを 読んで 仮分数で",
          "answer_kind": "mixed"
        },
        {
          "skill_id": "hyo-draw",
          "label": "色を ぬって あらわそう",
          "desc": "4分の7m に なるように ぬる",
          "answer_kind": "shade"
        },
        {
          "skill_id": "hyo-line",
          "label": "数直線の 分数",
          "desc": "1より 大きい 目もり",
          "answer_kind": "tick"
        }
      ]
    },
    {
      "module_id": "hen",
      "title": "仮分数と帯分数",
      "skills": [
        {
          "skill_id": "hen-mixed",
          "label": "仮分数 → 帯分数・整数",
          "desc": "3分の5 ＝ 1と3分の2",
          "answer_kind": "any"
        },
        {
          "skill_id": "hen-div",
          "label": "わり算で なおそう",
          "desc": "分子 ÷ 分母 の 商と あまり",
          "answer_kind": "steps"
        },
        {
          "skill_id": "hen-imp",
          "label": "帯分数 → 仮分数",
          "desc": "3と9分の2 ＝ 9分の29",
          "answer_kind": "frac"
        }
      ]
    },
    {
      "module_id": "eq",
      "title": "大きさの等しい分数",
      "skills": [
        {
          "skill_id": "eq-line",
          "label": "数直線で 等しい 分数",
          "desc": "3分の2 ＝ 6分の□",
          "answer_kind": "num"
        },
        {
          "skill_id": "eq-tap",
          "label": "同じ 大きさを タップ",
          "desc": "たてに そろう 目もり",
          "answer_kind": "tick"
        },
        {
          "skill_id": "eq-pick",
          "label": "等しい 分数を えらぼう",
          "desc": "数直線を 見て えらぶ",
          "answer_kind": "choice"
        }
      ]
    },
    {
      "module_id": "cmp",
      "title": "分数の大きさくらべ",
      "skills": [
        {
          "skill_id": "cmp-same",
          "label": "分母が 同じ 大きさくらべ",
          "desc": "4と7分の6 □ 7分の35",
          "answer_kind": "choice"
        },
        {
          "skill_id": "cmp-num",
          "label": "分子が 同じ 大きさくらべ",
          "desc": "6分の3 □ 8分の3",
          "answer_kind": "choice"
        },
        {
          "skill_id": "cmp-order",
          "label": "大きい じゅんに",
          "desc": "仮分数を ならべよう",
          "answer_kind": "order"
        }
      ]
    },
    {
      "module_id": "add",
      "title": "分数のたし算",
      "skills": [
        {
          "skill_id": "add-fig",
          "label": "図で 考える たし算",
          "desc": "5分の1 の 何こ分？",
          "answer_kind": "steps"
        },
        {
          "skill_id": "add-basic",
          "label": "真分数・仮分数の たし算",
          "desc": "5分の2 ＋ 5分の4",
          "answer_kind": "any"
        },
        {
          "skill_id": "add-mixed",
          "label": "帯分数の たし算",
          "desc": "4と3分の1 ＋ 2と3分の1",
          "answer_kind": "any"
        },
        {
          "skill_id": "add-whole",
          "label": "整数 ＋ 帯分数",
          "desc": "3 ＋ 1と9分の5",
          "answer_kind": "any"
        },
        {
          "skill_id": "add-carry",
          "label": "くり上がり",
          "desc": "2と8分の5 ＋ 8分の4",
          "answer_kind": "any"
        },
        {
          "skill_id": "add-one",
          "label": "答えが 整数",
          "desc": "1と7分の5 ＋ 7分の2",
          "answer_kind": "any"
        }
      ]
    },
    {
      "module_id": "sub",
      "title": "分数のひき算",
      "skills": [
        {
          "skill_id": "sub-basic",
          "label": "仮分数の ひき算",
          "desc": "4分の6 － 4分の3",
          "answer_kind": "any"
        },
        {
          "skill_id": "sub-mixed",
          "label": "帯分数の ひき算",
          "desc": "2と9分の6 － 1と9分の4",
          "answer_kind": "any"
        },
        {
          "skill_id": "sub-whole",
          "label": "帯分数 － 整数",
          "desc": "7と8分の3 － 5",
          "answer_kind": "any"
        },
        {
          "skill_id": "sub-borrow",
          "label": "くり下がり",
          "desc": "5と7分の2 － 7分の4",
          "answer_kind": "any"
        },
        {
          "skill_id": "sub-from",
          "label": "整数 － 分数",
          "desc": "3 － 5分の3",
          "answer_kind": "any"
        }
      ]
    },
    {
      "module_id": "word-problem",
      "title": "ことばのもんだい",
      "skills": [
        {
          "skill_id": "wp-add",
          "label": "あわせて いくつ？",
          "desc": "たし算の 文章題",
          "answer_kind": "steps"
        },
        {
          "skill_id": "wp-sub",
          "label": "ちがいは いくつ？",
          "desc": "ひき算の 文章題",
          "answer_kind": "steps"
        },
        {
          "skill_id": "wp-rem",
          "label": "のこりは いくつ？",
          "desc": "整数 － 分数 も",
          "answer_kind": "steps"
        },
        {
          "skill_id": "wp-prog",
          "label": "どこまで 進んだ？",
          "desc": "のこりの 分数から くらべる",
          "answer_kind": "steps"
        }
      ]
    },
    {
      "module_id": "error-hunter",
      "title": "エラーハンター",
      "skills": [
        {
          "skill_id": "eh-judge",
          "label": "正しい ノートを 見ぬく",
          "desc": "まちがいが ないことも あるよ",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-den",
          "label": "分母まで たしてる？",
          "desc": "5分の2 ＋ 5分の4 ＝ 10分の6 ?",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-carry",
          "label": "くり上がりの まちがい",
          "desc": "帯分数の たし算",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-borrow",
          "label": "くり下がりの まちがい",
          "desc": "帯分数の ひき算",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-whole",
          "label": "整数 － 分数 の まちがい",
          "desc": "整数を 分数に なおさない",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-wadd",
          "label": "整数 ＋ 帯分数 の まちがい",
          "desc": "整数を 分子に たしてる？",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-tomix",
          "label": "帯分数に なおす まちがい",
          "desc": "商と あまりが 逆？",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-toimp",
          "label": "仮分数に なおす まちがい",
          "desc": "整数と 分子を たしただけ？",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-cmp",
          "label": "分子が 同じ 大きさくらべ",
          "desc": "分母が 大きいほど 大きい ?",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-mixcmp",
          "label": "帯分数と 仮分数の 大きさくらべ",
          "desc": "見えている 数字だけで くらべてる？",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-eq",
          "label": "等しい 分数の まちがい",
          "desc": "分母に 3 たしたら 分子にも ?",
          "answer_kind": "steps"
        }
      ]
    }
  ],
  "misconceptions": [
    {
      "code": "誤概念①",
      "label": "分母どうしもたす／ひく（2/5＋4/5＝6/10）",
      "skills": [
        "add-fig",
        "add-basic",
        "add-mixed",
        "add-carry",
        "sub-basic",
        "sub-mixed",
        "wp-add",
        "eh-den"
      ]
    },
    {
      "code": "誤概念②",
      "label": "分数部分が1をこえてもくり上げない／くり上げた1を落とす",
      "skills": [
        "add-carry",
        "add-one",
        "wp-add",
        "eh-carry"
      ]
    },
    {
      "code": "誤概念③",
      "label": "くり下げずに、大きいほうから小さいほうをひく",
      "skills": [
        "sub-borrow",
        "wp-sub",
        "eh-borrow"
      ]
    },
    {
      "code": "誤概念④",
      "label": "整数－分数で、整数を分数に直さない（3－3/5＝2と3/5）",
      "skills": [
        "sub-from",
        "wp-rem",
        "eh-whole"
      ]
    },
    {
      "code": "誤概念⑤",
      "label": "整数＋帯分数で、整数を分子にたす（3＋1と5/9＝1と8/9）",
      "skills": [
        "add-whole",
        "eh-wadd"
      ]
    },
    {
      "code": "誤概念⑥",
      "label": "仮分数→帯分数で、商とあまりを入れかえる",
      "skills": [
        "hen-mixed",
        "hen-div",
        "eh-tomix"
      ]
    },
    {
      "code": "誤概念⑦",
      "label": "帯分数→仮分数で、整数と分子をたすだけ（3と2/9＝5/9）",
      "skills": [
        "hen-imp",
        "eh-toimp"
      ]
    },
    {
      "code": "誤概念⑧",
      "label": "分母が大きいほど大きいと思う（3/6＜3/8）",
      "skills": [
        "cmp-num",
        "wp-prog",
        "eh-cmp"
      ]
    },
    {
      "code": "誤概念⑨",
      "label": "帯分数と仮分数を、見えている数字の大きさだけでくらべる",
      "skills": [
        "cmp-same",
        "cmp-order",
        "eh-mixcmp"
      ]
    },
    {
      "code": "誤概念⑩",
      "label": "等しい分数を「たし算」でつくる（2/3＝5/6）",
      "skills": [
        "eq-line",
        "eq-tap",
        "eq-pick",
        "eh-eq"
      ]
    },
    {
      "code": "誤概念⑪",
      "label": "1より大きい分数を表せない（全体の目もりの数を分母にする・真分数でしか考えない）",
      "skills": [
        "hyo-kind",
        "hyo-unit",
        "hyo-tape",
        "hyo-draw",
        "hyo-line"
      ]
    }
  ]
};
