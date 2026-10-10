/**
 * 自動生成されたカタログ: データの活用
 *
 * 手で編集しないこと。アプリ側の MODULE_LEVELS / coverage-audit.ts が正本で、
 * scripts/gen-catalog.ts で再生成する。
 */
import type { AppCatalog } from './types.js';

export const data: AppCatalog = {
  "app_id": "data",
  "title": "データの活用",
  "subject": "算数",
  "grade": 6,
  "url": "https://syo6-detanokatuyou.vercel.app",
  "generated_at": "2026-10-10",
  "skill_count": 25,
  "modules": [
    {
      "module_id": "mean",
      "title": "平均値で くらべる",
      "skills": [
        {
          "skill_id": "mean-calc",
          "label": "① 平均値を 求める",
          "desc": "平均値 ＝ 合計 ÷ 個数。0 の データも 1こに 数える",
          "answer_kind": "number"
        },
        {
          "skill_id": "mean-compare",
          "label": "② 人数の ちがう 2つの 組を くらべる",
          "desc": "合計ではなく、平均値で くらべよう",
          "answer_kind": "number+choice"
        }
      ]
    },
    {
      "module_id": "dot",
      "title": "ドットプロットと 最頻値",
      "skills": [
        {
          "skill_id": "dot-draw",
          "label": "① ドットプロットに 表す",
          "desc": "データ 1つを 点 1つで、数直線の 上に おこう",
          "answer_kind": "dotplot"
        },
        {
          "skill_id": "dot-read",
          "label": "② ドットプロットを 読む",
          "desc": "何人？ 何以上？ いちばん 大きい 記録は？",
          "answer_kind": "number"
        },
        {
          "skill_id": "dot-mode",
          "label": "③ 最頻値を 求める",
          "desc": "いちばん 多く 出てくる「値」。人数ではないよ",
          "answer_kind": "number"
        }
      ]
    },
    {
      "module_id": "freq",
      "title": "度数分布表",
      "skills": [
        {
          "skill_id": "freq-class",
          "label": "① 階級・階級の 幅・度数",
          "desc": "「以上」は ふくむ、「未満」は ふくまない",
          "answer_kind": "choice"
        },
        {
          "skill_id": "freq-make",
          "label": "② 度数分布表に まとめる",
          "desc": "さかいめの 値に 気をつけて 数えよう",
          "answer_kind": "table"
        },
        {
          "skill_id": "freq-read",
          "label": "③ 度数分布表を 読む",
          "desc": "何以上は 何人？ 何番目は どの 階級？ 全体の 何%？",
          "answer_kind": "number"
        }
      ]
    },
    {
      "module_id": "hist",
      "title": "柱状グラフ",
      "skills": [
        {
          "skill_id": "hist-draw",
          "label": "① 柱状グラフを かく",
          "desc": "柱は すきまなく。高さは 度数",
          "answer_kind": "histdraw"
        },
        {
          "skill_id": "hist-read",
          "label": "② 柱状グラフを 読む",
          "desc": "いちばん 多い 階級・何以上・何番目",
          "answer_kind": "number"
        },
        {
          "skill_id": "hist-compare",
          "label": "③ 2つの 柱状グラフを くらべる",
          "desc": "どこに 集まっている？ ちらばりは？",
          "answer_kind": "choice"
        }
      ]
    },
    {
      "module_id": "med",
      "title": "中央値と 代表値",
      "skills": [
        {
          "skill_id": "med-calc",
          "label": "① 中央値を 求める",
          "desc": "小さい 順に ならべて まん中。偶数こなら 2つの 平均",
          "answer_kind": "number"
        },
        {
          "skill_id": "med-rep",
          "label": "② 3つの 代表値を 求める",
          "desc": "平均値・中央値・最頻値は ちがう 値に なることが ある",
          "answer_kind": "number+choice"
        },
        {
          "skill_id": "med-choose",
          "label": "③ 目的に 合う 代表値を えらぶ",
          "desc": "とびぬけた 値が あるときは？ いちばん 多いを 知りたいときは？",
          "answer_kind": "choice"
        }
      ]
    },
    {
      "module_id": "judge",
      "title": "データで 判断しよう",
      "skills": [
        {
          "skill_id": "judge-conclude",
          "label": "① 代表値などで 結論を 出す",
          "desc": "何で くらべるかで、結論が かわることも",
          "answer_kind": "choice"
        },
        {
          "skill_id": "judge-ppdac",
          "label": "② 問題解決の 5つの 段階",
          "desc": "問題 → 計画 → データ → 分析 → 結論",
          "answer_kind": "choice"
        },
        {
          "skill_id": "judge-critical",
          "label": "③ 結論を ふり返る",
          "desc": "人数の ちがい・データの かたよりに 気をつけよう",
          "answer_kind": "number+choice"
        }
      ]
    },
    {
      "module_id": "grf",
      "title": "いろいろな グラフ",
      "skills": [
        {
          "skill_id": "grf-pyramid",
          "label": "① 人口ピラミッドを 読む",
          "desc": "年れいの 階級ごとの 人口を 男女で",
          "answer_kind": "choice"
        },
        {
          "skill_id": "grf-combo",
          "label": "② 組み合わせた グラフを 読む",
          "desc": "棒グラフと 折れ線グラフ、左右の 目もりに 気をつけて",
          "answer_kind": "number"
        },
        {
          "skill_id": "grf-choose",
          "label": "③ 目的に 合う グラフを えらぶ",
          "desc": "大きさ・変わり方・割合・ちらばり",
          "answer_kind": "choice-graph"
        }
      ]
    },
    {
      "module_id": "eh",
      "title": "エラーハンター",
      "skills": [
        {
          "skill_id": "eh-mean",
          "label": "① 平均値の まちがい",
          "desc": "0 の 人を 数えていない…？",
          "answer_kind": "choice+number"
        },
        {
          "skill_id": "eh-median",
          "label": "② 中央値の まちがい",
          "desc": "ならべかえた？ 偶数こ のときは？",
          "answer_kind": "choice+number"
        },
        {
          "skill_id": "eh-mode",
          "label": "③ 最頻値の まちがい",
          "desc": "人数を 答えていない？",
          "answer_kind": "choice+number"
        },
        {
          "skill_id": "eh-class",
          "label": "④ 度数分布表の まちがい",
          "desc": "さかいめの 値は どの 階級？",
          "answer_kind": "choice+number"
        },
        {
          "skill_id": "eh-rep",
          "label": "⑤ 「平均値＝まん中」の まちがい",
          "desc": "平均値 以上の 人は、いつも 半分？",
          "answer_kind": "number+choice"
        }
      ]
    }
  ],
  "misconceptions": [
    {
      "code": "誤概念①",
      "label": "平均値の計算で 0 のデータを個数に入れない／人数のちがう集団を合計で比べる",
      "skills": [
        "mean-calc",
        "mean-compare",
        "eh-mean"
      ]
    },
    {
      "code": "誤概念②",
      "label": "中央値を並べかえずにとる／偶数個のとき まん中の2つの平均をとらない",
      "skills": [
        "med-calc",
        "med-rep",
        "eh-median"
      ]
    },
    {
      "code": "誤概念③",
      "label": "最頻値を「いちばん多い人数（度数）」や「いちばん大きい値」と答える",
      "skills": [
        "dot-mode",
        "med-rep",
        "eh-mode"
      ]
    },
    {
      "code": "誤概念④",
      "label": "階級の境目の値を下の階級に入れる（以上・未満の取りちがえ）",
      "skills": [
        "freq-class",
        "freq-make",
        "eh-class"
      ]
    },
    {
      "code": "誤概念⑤",
      "label": "平均値をデータのまん中の値と考える／平均値だけで判断し、外れ値や散らばりを見ない",
      "skills": [
        "med-choose",
        "judge-conclude",
        "eh-rep"
      ]
    },
    {
      "code": "誤概念⑥",
      "label": "全体の人数がちがう集団を、人数（度数）のまま比べる",
      "skills": [
        "mean-compare",
        "judge-critical"
      ]
    },
    {
      "code": "誤概念⑦",
      "label": "柱状グラフを棒グラフと同じに見る／目的に合わないグラフを選ぶ",
      "skills": [
        "hist-draw",
        "hist-read",
        "grf-choose"
      ]
    }
  ]
};
