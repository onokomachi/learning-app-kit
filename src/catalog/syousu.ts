/**
 * 自動生成されたカタログ: 小数のしくみ
 *
 * 手で編集しないこと。アプリ側のレベル定義が正本で、scripts/gen-catalog.ts で再生成する。
 */
import type { AppCatalog } from './types.js';

export const syousu: AppCatalog = {
  "app_id": "syousu",
  "title": "小数のしくみ",
  "subject": "算数",
  "grade": 4,
  "url": "https://syo4-syousu-v2.vercel.app",
  "generated_at": "2026-09-15",
  "skill_count": 31,
  "modules": [
    {
      "module_id": "decimal-addsub",
      "title": "小数の たし算・ひき算",
      "skills": [
        {
          "skill_id": "addsub-add-basic",
          "label": "たし算 ①",
          "desc": "小数第一位どうしのたし算",
          "answer_kind": "?"
        },
        {
          "skill_id": "addsub-add-diff",
          "label": "たし算 ②（桁ちがい）",
          "desc": "3.5 + 4.18 のような問題",
          "answer_kind": "?"
        },
        {
          "skill_id": "addsub-sub-basic",
          "label": "ひき算 ①",
          "desc": "小数第一位どうしのひき算",
          "answer_kind": "?"
        },
        {
          "skill_id": "addsub-sub-diff",
          "label": "ひき算 ②（桁ちがい）",
          "desc": "6.17 − 3.8 のような問題",
          "answer_kind": "?"
        },
        {
          "skill_id": "addsub-sub-whole",
          "label": "ひき算 ③（空位）",
          "desc": "6 − 2.45・9 − 0.058 など",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "decimal-muldiv",
      "title": "小数の かけ算・わり算",
      "skills": [
        {
          "skill_id": "div-basic",
          "label": "わり算 ①",
          "desc": "わり切れる（空位の0も）4.08 ÷ 4",
          "answer_kind": "?"
        },
        {
          "skill_id": "div-carry",
          "label": "わり算 ②",
          "desc": "0をおろして わり進む 4.5 ÷ 6",
          "answer_kind": "?"
        },
        {
          "skill_id": "div-remainder",
          "label": "わり算 ③",
          "desc": "商は一の位まで・あまり 13.5 ÷ 4",
          "answer_kind": "?"
        },
        {
          "skill_id": "mul-tenths",
          "label": "かけ算 ①",
          "desc": "小数第一位 × 1けた（2.4 × 3）",
          "answer_kind": "?"
        },
        {
          "skill_id": "mul-hundredths",
          "label": "かけ算 ②",
          "desc": "小数第二位 × 1けた（1.36 × 7）",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "number-line",
      "title": "数直線・大小くらべ",
      "skills": [
        {
          "skill_id": "compare-tenths",
          "label": "くらべる ①",
          "desc": "0.3 と 0.7（小数第一位）",
          "answer_kind": "?"
        },
        {
          "skill_id": "compare-mixed",
          "label": "くらべる ②",
          "desc": "0.5 と 0.36（けたがちがう）",
          "answer_kind": "?"
        },
        {
          "skill_id": "compare-int",
          "label": "くらべる ③",
          "desc": "2.05 と 2.5 など",
          "answer_kind": "?"
        },
        {
          "skill_id": "line-tenths",
          "label": "数直線 ①",
          "desc": "0〜1（0.1ずつ）に小数をおく",
          "answer_kind": "?"
        },
        {
          "skill_id": "line-0to10",
          "label": "数直線 ②",
          "desc": "0〜10（0.5ずつ）に小数をおく",
          "answer_kind": "?"
        },
        {
          "skill_id": "line-hundredths",
          "label": "数直線 ③",
          "desc": "3.54 など（0.01ずつ・拡大）",
          "answer_kind": "?"
        },
        {
          "skill_id": "order-3",
          "label": "ならべかえ ①",
          "desc": "3つの小数を 順にならべる",
          "answer_kind": "?"
        },
        {
          "skill_id": "order-5",
          "label": "ならべかえ ②",
          "desc": "5つの小数を 順にならべる（100m走）",
          "answer_kind": "?"
        }
      ]
    },
    {
      "module_id": "place-value",
      "title": "位取りラボ",
      "skills": [
        {
          "skill_id": "collect-basic",
          "label": "あつめる ①",
          "desc": "0.235 は 0.001 を 何こ？",
          "answer_kind": "?"
        },
        {
          "skill_id": "collect-regroup",
          "label": "あつめる ②",
          "desc": "0.1 を 14こ あつめると？",
          "answer_kind": "?"
        },
        {
          "skill_id": "compose-2",
          "label": "つくる ①",
          "desc": "0.01 の位まで（2.13）",
          "answer_kind": "?"
        },
        {
          "skill_id": "compose-3",
          "label": "つくる ②",
          "desc": "0.001 の位まで（3.245）",
          "answer_kind": "?"
        },
        {
          "skill_id": "placeid-2",
          "label": "位の数字 ①",
          "desc": "小数第二位まで（2.13）",
          "answer_kind": "?"
        },
        {
          "skill_id": "placeid-3",
          "label": "位の数字 ②",
          "desc": "小数第三位まで（1.695）",
          "answer_kind": "?"
        },
        {
          "skill_id": "scale-10",
          "label": "10倍",
          "desc": "2.45 を 10倍すると？",
          "answer_kind": "?"
        },
        {
          "skill_id": "scale-tenth",
          "label": "10分の1",
          "desc": "2.45 の 1/10 は？",
          "answer_kind": "?"
        },
        {
          "skill_id": "scale-100",
          "label": "100倍・1/100",
          "desc": "377.6 を 1/100 にすると？",
          "answer_kind": "?"
        },
        {
          "skill_id": "scale-mix",
          "label": "ミックス",
          "desc": "10倍・1/10・100倍・1/100",
          "answer_kind": "?"
        },
        {
          "skill_id": "unit-length",
          "label": "長さの たんい",
          "desc": "5m28cm は 何 m？",
          "answer_kind": "?"
        },
        {
          "skill_id": "unit-mass",
          "label": "重さの たんい",
          "desc": "673g は 何 kg？",
          "answer_kind": "?"
        },
        {
          "skill_id": "unit-mix",
          "label": "ミックス",
          "desc": "長さ・重さ がまざる",
          "answer_kind": "?"
        }
      ]
    }
  ],
  "misconceptions": []
};
