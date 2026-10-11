/**
 * 自動生成されたカタログ: 分数と整数
 *
 * 手で編集しないこと。アプリ側の MODULE_LEVELS / coverage-audit.ts が正本で、
 * scripts/gen-catalog.ts で再生成する。
 */
import type { AppCatalog } from './types.js';

export const bunsuuSeisuu: AppCatalog = {
  "app_id": "bunsuu-seisuu",
  "title": "分数と整数",
  "subject": "算数",
  "grade": 5,
  "url": "https://syo5-bunsuutoseisuu.vercel.app",
  "generated_at": "2026-10-11",
  "skill_count": 33,
  "modules": [
    {
      "module_id": "wari",
      "title": "わり算と分数",
      "skills": [
        {
          "skill_id": "wari-quot",
          "label": "商を 分数で",
          "desc": "3 ÷ 4 ＝ 4分の3",
          "answer_kind": "frac"
        },
        {
          "skill_id": "wari-back",
          "label": "分数を わり算の 式に",
          "desc": "5分の3 ＝ 3 ÷ 5",
          "answer_kind": "num"
        },
        {
          "skill_id": "wari-fig",
          "label": "図を 見て 分数で",
          "desc": "3L を 4人で 分けた 1人分は？",
          "answer_kind": "steps"
        },
        {
          "skill_id": "wari-draw",
          "label": "図に 色を ぬろう",
          "desc": "商を あらわす 分だけ ぬる",
          "answer_kind": "shade"
        },
        {
          "skill_id": "wari-mixed",
          "label": "1より 大きい 商",
          "desc": "7 ÷ 4 ＝ 仮分数 ＝ 帯分数",
          "answer_kind": "steps"
        }
      ]
    },
    {
      "module_id": "bai",
      "title": "何倍かを分数で",
      "skills": [
        {
          "skill_id": "bai-less",
          "label": "1より 小さい 倍",
          "desc": "3m は 4m の 何倍？",
          "answer_kind": "frac"
        },
        {
          "skill_id": "bai-more",
          "label": "1より 大きい 倍",
          "desc": "5m は 4m の 何倍？",
          "answer_kind": "frac"
        },
        {
          "skill_id": "bai-pick",
          "label": "もとにする量と 式",
          "desc": "どちらを 1と みる？",
          "answer_kind": "choice"
        },
        {
          "skill_id": "bai-line",
          "label": "数直線に あらわす",
          "desc": "1と みた ときの 位置",
          "answer_kind": "tick"
        }
      ]
    },
    {
      "module_id": "kan",
      "title": "整数・小数と分数",
      "skills": [
        {
          "skill_id": "kan-int",
          "label": "整数を 分数で",
          "desc": "3 ＝ 12分の4 ぶんぼ…",
          "answer_kind": "frac"
        },
        {
          "skill_id": "kan-dec",
          "label": "小数を 分数で",
          "desc": "0.3 ＝ 10分の3",
          "answer_kind": "frac"
        },
        {
          "skill_id": "kan-red",
          "label": "約分して 分数で",
          "desc": "0.25 ＝ 100分の25 ＝ 4分の1",
          "answer_kind": "frac"
        },
        {
          "skill_id": "kan-line",
          "label": "数直線で 小数と 分数",
          "desc": "同じ ところを さがす",
          "answer_kind": "tick"
        }
      ]
    },
    {
      "module_id": "sho",
      "title": "分数を小数・整数で",
      "skills": [
        {
          "skill_id": "sho-conv",
          "label": "分数を 小数で",
          "desc": "4分の3 ＝ 0.75",
          "answer_kind": "num"
        },
        {
          "skill_id": "sho-conv2",
          "label": "分数を 小数で（むずかしめ）",
          "desc": "8分の3 ・ 1と4分の3",
          "answer_kind": "num"
        },
        {
          "skill_id": "sho-round",
          "label": "わりきれない 分数を 小数で",
          "desc": "3分の2 ≒ 0.67（四捨五入）",
          "answer_kind": "num"
        },
        {
          "skill_id": "sho-int",
          "label": "分数を 整数で",
          "desc": "4分の12 ＝ 3",
          "answer_kind": "choice"
        },
        {
          "skill_id": "sho-cmp",
          "label": "大きさを くらべよう",
          "desc": "分数・小数・整数を くらべる",
          "answer_kind": "choice"
        },
        {
          "skill_id": "sho-order",
          "label": "小さい じゅんに",
          "desc": "3つの 数を ならべる",
          "answer_kind": "choice"
        },
        {
          "skill_id": "sho-line",
          "label": "数直線に 分数を",
          "desc": "目盛りを 読む・タップする",
          "answer_kind": "tick"
        }
      ]
    },
    {
      "module_id": "word-problem",
      "title": "ことばのもんだい",
      "skills": [
        {
          "skill_id": "wp-share",
          "label": "等分の もんだい",
          "desc": "1人分は 何L？",
          "answer_kind": "steps"
        },
        {
          "skill_id": "wp-group",
          "label": "〜ずつ 入れる もんだい",
          "desc": "何こ分に なる？",
          "answer_kind": "steps"
        },
        {
          "skill_id": "wp-bai",
          "label": "何倍の もんだい",
          "desc": "しきと 分数の 答え",
          "answer_kind": "steps"
        },
        {
          "skill_id": "wp-why",
          "label": "なぜ？ どっち？",
          "desc": "考えて えらぼう",
          "answer_kind": "choice"
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
          "skill_id": "eh-swap",
          "label": "分子と 分母が 反対",
          "desc": "3 ÷ 4 ＝ 4分の3 ?",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-rem",
          "label": "わりきれないから…？",
          "desc": "分数に できない 思いこみ",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-big",
          "label": "分数は 1より 小さい？",
          "desc": "1より 大きい 商の まちがい",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-dec",
          "label": "小数の 位と 分母",
          "desc": "0.07 ＝ 10分の7 ?",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-dot",
          "label": "「.」で つなぐ まちがい",
          "desc": "4分の3 ＝ 3.4 ?",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-div",
          "label": "分母 ÷ 分子 の まちがい",
          "desc": "4分の3 ＝ 4 ÷ 3 ?",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-bai",
          "label": "もとにする量の まちがい",
          "desc": "何倍かの 式の まちがい",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-size",
          "label": "分母が 大きいと 大きい？",
          "desc": "大きさくらべの まちがい",
          "answer_kind": "steps"
        }
      ]
    }
  ],
  "misconceptions": [
    {
      "code": "誤概念①",
      "label": "分子と分母をとりちがえる（3÷4 ＝ 4分の3 / 3分の4 の取りちがえ）",
      "skills": [
        "wari-quot",
        "wari-back",
        "wari-fig",
        "wp-share",
        "wp-group",
        "eh-swap"
      ]
    },
    {
      "code": "誤概念②",
      "label": "わりきれない商は分数にできないと思う（あまりで答える）",
      "skills": [
        "wp-why",
        "eh-rem"
      ]
    },
    {
      "code": "誤概念③",
      "label": "分数は1より小さいと思いこむ（仮分数・帯分数の商や倍を認めない）",
      "skills": [
        "wari-mixed",
        "bai-more",
        "eh-big"
      ]
    },
    {
      "code": "誤概念④",
      "label": "分母が大きいほど大きいと思う",
      "skills": [
        "sho-cmp",
        "eh-size"
      ]
    },
    {
      "code": "誤概念⑤",
      "label": "小数の位と分母の0の数がずれる（0.07 ＝ 10分の7）",
      "skills": [
        "kan-dec",
        "kan-red",
        "eh-dec"
      ]
    },
    {
      "code": "誤概念⑥",
      "label": "分子と分母を「.」でつなぐ（4分の3 ＝ 3.4）",
      "skills": [
        "sho-conv",
        "sho-conv2",
        "eh-dot"
      ]
    },
    {
      "code": "誤概念⑦",
      "label": "分母÷分子にしてしまう（4分の3 ＝ 4÷3）",
      "skills": [
        "sho-conv",
        "sho-conv2",
        "sho-round",
        "eh-div"
      ]
    },
    {
      "code": "誤概念⑧",
      "label": "もとにする量とくらべる量をとりちがえる（何倍の式が逆）",
      "skills": [
        "bai-less",
        "bai-more",
        "bai-pick",
        "wp-bai",
        "eh-bai"
      ]
    },
    {
      "code": "誤概念⑨",
      "label": "わりきれない商を四捨五入せずに切りすてる・位をまちがえる",
      "skills": [
        "sho-round"
      ]
    }
  ]
};
