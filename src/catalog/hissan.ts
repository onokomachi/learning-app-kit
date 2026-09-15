/**
 * 自動生成されたカタログ: わり算の筆算
 *
 * 手で編集しないこと。アプリ側のレベル定義が正本で、scripts/gen-catalog.ts で再生成する。
 */
import type { AppCatalog } from './types.js';

export const hissan: AppCatalog = {
  "app_id": "hissan",
  "title": "わり算の筆算",
  "subject": "算数",
  "grade": 4,
  "url": "https://wari-hissann3.vercel.app",
  "generated_at": "2026-09-15",
  "skill_count": 27,
  "modules": [
    {
      "module_id": "check",
      "title": "たしかめ算",
      "skills": [
        {
          "skill_id": "check-nodiv",
          "label": "わりきれる とき",
          "desc": "わる数 × 商 ＝ わられる数",
          "answer_kind": "?"
        },
        {
          "skill_id": "check-rem",
          "label": "あまりの ある とき",
          "desc": "わる数 × 商 ＋ あまり ＝ わられる数",
          "answer_kind": "?"
        },
        {
          "skill_id": "check-big",
          "label": "大きな数で ちょうせん",
          "desc": "3けたの わり算を たしかめよう",
          "answer_kind": "?"
        },
        {
          "skill_id": "check-shiki",
          "label": "けん算の式を 書く",
          "desc": "997÷49＝20あまり17 → □×20＋□＝□",
          "answer_kind": "?"
        },
        {
          "skill_id": "check-findnum",
          "label": "ある数を もとめる",
          "desc": "けん算の式で「ある数」を さがせ！",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "estimate",
      "title": "商の見当づけ",
      "skills": [
        {
          "skill_id": "est-place",
          "label": "どの位に たつ？",
          "desc": "商を 立てはじめる 位を あてよう",
          "answer_kind": "?"
        },
        {
          "skill_id": "est-digits",
          "label": "商は 何けた？",
          "desc": "計算する前に けた数を 見ぬこう",
          "answer_kind": "?"
        },
        {
          "skill_id": "est-round",
          "label": "仮の商の 見当",
          "desc": "171÷21 → 21を20とみて 見当8",
          "answer_kind": "?"
        },
        {
          "skill_id": "est-cond",
          "label": "□に入る数字は？",
          "desc": "62)6□9 の商が 10より小さくなる □は？",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "mental",
      "title": "あんざん わり算",
      "skills": [
        {
          "skill_id": "mental-basic",
          "label": "九九の はんい",
          "desc": "48÷6 のような わりきれる わり算",
          "answer_kind": "?"
        },
        {
          "skill_id": "mental-rem",
          "label": "あまりの ある わり算",
          "desc": "50÷7 は 7あまり1",
          "answer_kind": "?"
        },
        {
          "skill_id": "mental-tens",
          "label": "何十の わり算",
          "desc": "60÷3 や 240÷3 を 10のまとまりで",
          "answer_kind": "?"
        },
        {
          "skill_id": "mental-hundreds",
          "label": "何百の わり算",
          "desc": "600÷3 を 100のまとまりで",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "rules",
      "title": "わり算のきまり",
      "skills": [
        {
          "skill_id": "rules-tens",
          "label": "何十 ÷ 何十",
          "desc": "90÷30 は 9÷3 と 同じ商",
          "answer_kind": "?"
        },
        {
          "skill_id": "rules-hundreds",
          "label": "何百 ÷ 何百",
          "desc": "2400÷600 は 24÷6 と 同じ商",
          "answer_kind": "?"
        },
        {
          "skill_id": "rules-rem",
          "label": "あまりに ちゅうい！",
          "desc": "740÷90 の あまりは 2 じゃなくて 20",
          "answer_kind": "?"
        },
        {
          "skill_id": "rules-kufu",
          "label": "くふうして 筆算",
          "desc": "6400÷800 は 0を消して 64÷8",
          "answer_kind": "?"
        },
        {
          "skill_id": "rules-trap",
          "label": "あまりの わなを 見ぬけ",
          "desc": "6500÷700 の あまりは どれ？",
          "answer_kind": "?"
        },
        {
          "skill_id": "rules-equal",
          "label": "商が 等しい式を さがせ",
          "desc": "120÷60 と 同じ商の式を 2つ えらぶ",
          "answer_kind": "?"
        },
        {
          "skill_id": "rules-blank",
          "label": "□に あてはまる数",
          "desc": "72÷9 ＝ 720÷□",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "word-problem",
      "title": "ことばの もんだい",
      "skills": [
        {
          "skill_id": "wp-share",
          "label": "同じ数ずつ 分ける",
          "desc": "1人分は 何こ？（等分除）",
          "answer_kind": "?"
        },
        {
          "skill_id": "wp-group",
          "label": "いくつ分 とれる？",
          "desc": "何ふくろ できる？（包含除）",
          "answer_kind": "?"
        },
        {
          "skill_id": "wp-rem",
          "label": "あまりの ある もんだい",
          "desc": "商と あまりを 答えよう",
          "answer_kind": "?"
        },
        {
          "skill_id": "wp-up",
          "label": "あまりを 切り上げる",
          "desc": "ぜんいん のれるには あと1つ！",
          "answer_kind": "?"
        },
        {
          "skill_id": "wp-down",
          "label": "あまりを 切り捨てる",
          "desc": "あまりでは 1つ 作れない…",
          "answer_kind": "?"
        },
        {
          "skill_id": "wp-times",
          "label": "何倍かを もとめる",
          "desc": "320kgは 64kgの 何倍？",
          "answer_kind": "?"
        },
        {
          "skill_id": "wp-big",
          "label": "大きな数の もんだい",
          "desc": "2けたで わる 文章題",
          "answer_kind": "?"
        }
      ]
    }
  ],
  "misconceptions": []
};
