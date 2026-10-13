/**
 * 自動生成されたカタログ: 平均
 *
 * 手で編集しないこと。アプリ側の MODULE_LEVELS / coverage-audit.ts が正本で、
 * scripts/gen-catalog.ts で再生成する。
 */
import type { AppCatalog } from './types.js';

export const heikin: AppCatalog = {
  "app_id": "heikin",
  "title": "平均",
  "subject": "算数",
  "grade": 5,
  "url": "https://syo5-heikinn.vercel.app",
  "generated_at": "2026-10-13",
  "skill_count": 30,
  "modules": [
    {
      "module_id": "nara",
      "title": "ならして みよう",
      "skills": [
        {
          "skill_id": "nara-pick",
          "label": "① ならすと 高さは？",
          "desc": "棒グラフを 同じ 高さに ならそう",
          "answer_kind": "choice"
        },
        {
          "skill_id": "nara-move",
          "label": "② ブロックを うつして ならす",
          "desc": "高い棒から 低い棒へ うつして みよう",
          "answer_kind": "steps"
        },
        {
          "skill_id": "nara-per",
          "label": "③ 1こ あたりに ならす",
          "desc": "ぜんぶの 量を こ数で 分けよう",
          "answer_kind": "num"
        },
        {
          "skill_id": "nara-range",
          "label": "④ 平均は どの はんい？",
          "desc": "平均は 小さい数と 大きい数の あいだ",
          "answer_kind": "choice"
        }
      ]
    },
    {
      "module_id": "calc",
      "title": "平均を もとめよう",
      "skills": [
        {
          "skill_id": "calc-basic",
          "label": "① 平均を 求めよう",
          "desc": "3〜5この データ・わり切れる",
          "answer_kind": "num"
        },
        {
          "skill_id": "calc-mid",
          "label": "② 4〜6この 平均",
          "desc": "2けたの 数を たして わろう",
          "answer_kind": "num"
        },
        {
          "skill_id": "calc-week",
          "label": "③ 1週間の 平均",
          "desc": "7日分の データを ÷7",
          "answer_kind": "num"
        },
        {
          "skill_id": "calc-zero",
          "label": "④ 0が ある 平均",
          "desc": "0も 1つと 数えるよ",
          "answer_kind": "num"
        },
        {
          "skill_id": "calc-dec",
          "label": "⑤ 平均が 小数に なる",
          "desc": "数えるものでも 小数で 表せる",
          "answer_kind": "num"
        },
        {
          "skill_id": "calc-decdata",
          "label": "⑥ 小数の データの 平均",
          "desc": "小数点を そろえて たそう",
          "answer_kind": "num"
        },
        {
          "skill_id": "calc-big",
          "label": "⑦ 大きな 数の 平均",
          "desc": "4けたの 数を 6〜7こ たす",
          "answer_kind": "num"
        }
      ]
    },
    {
      "module_id": "total",
      "title": "平均から ぜんたいを",
      "skills": [
        {
          "skill_id": "total-mul",
          "label": "① 平均 × こ数",
          "desc": "全体の 量を 求める 式を えらぼう",
          "answer_kind": "steps"
        },
        {
          "skill_id": "total-days",
          "label": "② 1日の 平均から よそく",
          "desc": "1週間・1か月では？",
          "answer_kind": "num"
        },
        {
          "skill_id": "total-count",
          "label": "③ 全体 ÷ 平均 ＝ こ数",
          "desc": "何こぶん あるかな",
          "answer_kind": "steps"
        },
        {
          "skill_id": "total-goal",
          "label": "④ 目標の 平均に するには",
          "desc": "あと何点 とれば いい？",
          "answer_kind": "num"
        },
        {
          "skill_id": "total-two",
          "label": "⑤ 2つの 平均を あわせる",
          "desc": "人数が ちがう とき",
          "answer_kind": "num"
        }
      ]
    },
    {
      "module_id": "use",
      "title": "平均の つかい方",
      "skills": [
        {
          "skill_id": "use-measure",
          "label": "① 測定値の 平均",
          "desc": "何回か はかって 正かくな 値に",
          "answer_kind": "steps"
        },
        {
          "skill_id": "use-outlier",
          "label": "② とびはなれた 値を のぞく",
          "desc": "のぞいた 平均を 求めよう",
          "answer_kind": "steps"
        },
        {
          "skill_id": "use-judge",
          "label": "③ のぞく？ のぞかない？",
          "desc": "目的に 合わせて 考えよう",
          "answer_kind": "choice"
        },
        {
          "skill_id": "use-step",
          "label": "④ 歩はばで きょりを よそく",
          "desc": "平均を 日常に いかそう",
          "answer_kind": "num"
        }
      ]
    },
    {
      "module_id": "word",
      "title": "ことばの もんだい",
      "skills": [
        {
          "skill_id": "word-which",
          "label": "① どの 式？",
          "desc": "平均・全体・こ数・ごうけい の どれを 求める？",
          "answer_kind": "steps"
        },
        {
          "skill_id": "word-compare",
          "label": "② 平均で くらべる",
          "desc": "人数が ちがう 2つを くらべよう",
          "answer_kind": "steps"
        }
      ]
    },
    {
      "module_id": "error",
      "title": "エラーハンター",
      "skills": [
        {
          "skill_id": "eh-count",
          "label": "① 0を 数えわすれた",
          "desc": "こ数の まちがい",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-mid",
          "label": "② まん中の 数を 平均に した",
          "desc": "平均と まん中の 数は ちがう",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-range",
          "label": "③ 大きい数と 小さい数だけで 決めた",
          "desc": "ぜんぶの データを つかおう",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-avgavg",
          "label": "④ 平均の 平均を とった",
          "desc": "人数が ちがう ときの わな",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-total",
          "label": "⑤ 全体を わり算で 求めた",
          "desc": "全体 ＝ 平均 × こ数",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-sum",
          "label": "⑥ ごうけいの たし算ミス",
          "desc": "平均の はんいで 見直そう",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-out",
          "label": "⑦ とびはなれた 値を ふくめた",
          "desc": "目的に 合わせて のぞこう",
          "answer_kind": "steps"
        },
        {
          "skill_id": "eh-rem",
          "label": "⑧ 平均を「あまり」で 答えた",
          "desc": "わり切れない ときは 小数で",
          "answer_kind": "steps"
        }
      ]
    }
  ],
  "misconceptions": [
    {
      "code": "誤概念①",
      "label": "0の日を こ数に 入れない",
      "skills": [
        "calc-zero",
        "eh-count"
      ]
    },
    {
      "code": "誤概念②",
      "label": "合計を そのまま 答える／わる数（こ数）を まちがえる",
      "skills": [
        "calc-basic",
        "calc-mid",
        "calc-week",
        "eh-count"
      ]
    },
    {
      "code": "誤概念③",
      "label": "まん中の数や（大＋小）÷2 を 平均と思う（ぜんぶの データを 使わない）",
      "skills": [
        "nara-range",
        "eh-mid",
        "eh-range"
      ]
    },
    {
      "code": "誤概念④",
      "label": "平均が データの はんいの 外に なっても 気づかない（たし算ミス）",
      "skills": [
        "eh-sum"
      ]
    },
    {
      "code": "誤概念⑤",
      "label": "人数が ちがう 組で 平均の 平均を とる",
      "skills": [
        "total-two",
        "word-compare",
        "eh-avgavg"
      ]
    },
    {
      "code": "誤概念⑥",
      "label": "全体（合計）を 求めるのに わり算を する（全体 ＝ 平均 × こ数）",
      "skills": [
        "total-mul",
        "total-days",
        "total-count",
        "total-goal",
        "eh-total"
      ]
    },
    {
      "code": "誤概念⑦",
      "label": "人数など 分けられない 量の 平均を「あまり」で 答える",
      "skills": [
        "calc-big",
        "eh-rem"
      ]
    },
    {
      "code": "誤概念⑧",
      "label": "目的を 見ずに とびはなれた 値を あつかう",
      "skills": [
        "use-outlier",
        "use-judge",
        "eh-out"
      ]
    }
  ]
};
