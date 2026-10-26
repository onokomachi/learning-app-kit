export const taiseki = {
    "app_id": "taiseki",
    "title": "直方体や立方体の体積",
    "subject": "算数",
    "grade": 5,
    "url": "https://syo5-tyokuhotaiyarippoutainotaiseki.vercel.app",
    "generated_at": "2026-10-26",
    "skill_count": 31,
    "modules": [
        {
            "module_id": "imi",
            "title": "体積の いみ",
            "skills": [
                {
                    "skill_id": "imi-count",
                    "label": "① 積み木の 数で 体積",
                    "desc": "1cm³ が 何こ分？",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "imi-stack",
                    "label": "② いろいろな 形の 積み木",
                    "desc": "まわして かくれた 積み木も 数えよう",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "imi-cmp",
                    "label": "③ どちらが 大きい？",
                    "desc": "見た目に だまされない",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "imi-build",
                    "label": "④ 積み木で 直方体を つくろう",
                    "desc": "縦・横・高さを えらんで つくる",
                    "answer_kind": "build"
                }
            ]
        },
        {
            "module_id": "form",
            "title": "直方体・立方体の 体積",
            "skills": [
                {
                    "skill_id": "form-expr",
                    "label": "① 公式を 式に しよう",
                    "desc": "縦 × 横 × 高さ",
                    "answer_kind": "exprBuild"
                },
                {
                    "skill_id": "form-cuboid",
                    "label": "② 直方体の 体積",
                    "desc": "3つの 長さを かける",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "form-cube",
                    "label": "③ 立方体の 体積",
                    "desc": "1辺 × 1辺 × 1辺",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "form-net",
                    "label": "④ 展開図から 体積",
                    "desc": "組み立てると どんな 直方体？",
                    "answer_kind": "number"
                }
            ]
        },
        {
            "module_id": "rev",
            "title": "体積から 長さ",
            "skills": [
                {
                    "skill_id": "rev-height",
                    "label": "① 体積から 高さ",
                    "desc": "□ ＝ 体積 ÷ 縦 ÷ 横",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "rev-cube",
                    "label": "② 立方体の 1辺",
                    "desc": "同じ 数を 3回 かけると？",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "rev-same",
                    "label": "③ 体積が 同じ 直方体",
                    "desc": "形が ちがっても 同じ 体積",
                    "answer_kind": "multi"
                },
                {
                    "skill_id": "rev-table",
                    "label": "④ 高さと 体積の 表",
                    "desc": "高さが 2倍なら 体積は？",
                    "answer_kind": "tableFill"
                }
            ]
        },
        {
            "module_id": "comb",
            "title": "組み合わせた 立体",
            "skills": [
                {
                    "skill_id": "comb-add",
                    "label": "① 分けて たす",
                    "desc": "2つの 直方体に 分けよう",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "comb-sub",
                    "label": "② 大きい 直方体から ひく",
                    "desc": "うすい 部分を おぎなって",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "comb-step",
                    "label": "③ 階段・へこみの 形",
                    "desc": "3つの 部分が ある 立体",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "comb-expr",
                    "label": "④ 正しい 式は どれ？",
                    "desc": "式から 考え方を 読む",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "comb-split",
                    "label": "⑤ どこで 切る？",
                    "desc": "2つの 直方体に 分ける 線",
                    "answer_kind": "multi"
                }
            ]
        },
        {
            "module_id": "big",
            "title": "大きな 体積（m³）",
            "skills": [
                {
                    "skill_id": "big-m3",
                    "label": "① m³ で 体積",
                    "desc": "1辺 1m の 立方体の いくつ分",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "big-conv",
                    "label": "② m³ と cm³",
                    "desc": "1m³ ＝ 1000000cm³",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "big-mix",
                    "label": "③ 単位が まざった 長さ",
                    "desc": "m と cm を そろえてから",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "big-one",
                    "label": "④ 1m³ に なるのは どれ？",
                    "desc": "立方体だけじゃ ない",
                    "answer_kind": "multi"
                },
                {
                    "skill_id": "big-unit",
                    "label": "⑤ 単位を そろえて くらべる",
                    "desc": "m の 直方体と cm の 直方体",
                    "answer_kind": "choice"
                }
            ]
        },
        {
            "module_id": "yoseki",
            "title": "容積と かさ",
            "skills": [
                {
                    "skill_id": "yoseki-inner",
                    "label": "① 内のりを もとめる",
                    "desc": "板の 厚さを ひく",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "yoseki-calc",
                    "label": "② 容積を もとめる",
                    "desc": "内のりで 縦 × 横 × 深さ",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "yoseki-liter",
                    "label": "③ 容積を L で",
                    "desc": "1L ＝ 1000cm³",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "yoseki-conv",
                    "label": "④ L・mL・cm³",
                    "desc": "かさの 単位の かんさん",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "yoseki-water",
                    "label": "⑤ 水の 量と 深さ",
                    "desc": "水そうの 水",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "yoseki-stone",
                    "label": "⑥ 石の 体積を 水で はかる",
                    "desc": "ふえた 水の 体積 ＝ 石の 体積",
                    "answer_kind": "number"
                }
            ]
        },
        {
            "module_id": "tani",
            "title": "単位の 関係",
            "skills": [
                {
                    "skill_id": "tani-table",
                    "label": "① 長さ・面積・体積の 表",
                    "desc": "10倍 → 100倍 → 1000倍",
                    "answer_kind": "tableFill"
                },
                {
                    "skill_id": "tani-times",
                    "label": "② 1辺が ○倍 なら",
                    "desc": "体積は 何倍？",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "tani-rel",
                    "label": "③ 単位の 関係",
                    "desc": "1m³ ＝ 1kL ＝ 1000L",
                    "answer_kind": "number"
                }
            ]
        }
    ],
    "misconceptions": [
        {
            "code": "誤概念①",
            "label": "3つの長さをたす（体積を長さの合計と思う）",
            "skills": [
                "form-expr",
                "form-cuboid",
                "form-net",
                "rev-same",
                "eh-add"
            ]
        },
        {
            "code": "誤概念②",
            "label": "高さをかけわすれる（底の面積で止める）",
            "skills": [
                "form-cuboid",
                "form-net",
                "rev-height",
                "imi-count",
                "eh-area"
            ]
        },
        {
            "code": "誤概念③",
            "label": "立方体で1辺×3・1辺×1辺にする",
            "skills": [
                "form-cube",
                "rev-cube",
                "eh-cube"
            ]
        },
        {
            "code": "誤概念④",
            "label": "見えている積み木だけ数える",
            "skills": [
                "imi-count",
                "imi-stack"
            ]
        },
        {
            "code": "誤概念⑤",
            "label": "1m³を100cm³・10000cm³と考える（長さ・面積の関係のまま）",
            "skills": [
                "big-conv",
                "big-one",
                "tani-table",
                "tani-rel",
                "eh-unit"
            ]
        },
        {
            "code": "誤概念⑥",
            "label": "mとcmをそろえずにかける",
            "skills": [
                "big-mix",
                "big-unit",
                "eh-mix"
            ]
        },
        {
            "code": "誤概念⑦",
            "label": "容積を外のりで求める・板の厚さの引き方をまちがえる",
            "skills": [
                "yoseki-inner",
                "yoseki-calc",
                "yoseki-liter",
                "eh-outer"
            ]
        },
        {
            "code": "誤概念⑧",
            "label": "組み合わせた立体で重なりを2回数える・長さを読みちがえる",
            "skills": [
                "comb-add",
                "comb-sub",
                "comb-step",
                "comb-expr",
                "comb-split",
                "eh-double"
            ]
        },
        {
            "code": "誤概念⑨",
            "label": "1L＝100cm³と考える（かさの単位の関係）",
            "skills": [
                "yoseki-liter",
                "yoseki-conv",
                "yoseki-water",
                "tani-rel",
                "eh-liter"
            ]
        },
        {
            "code": "誤概念⑩",
            "label": "1辺が○倍なら体積も○倍と考える",
            "skills": [
                "tani-times",
                "tani-table",
                "rev-table"
            ]
        },
        {
            "code": "誤概念⑪",
            "label": "形がちがえば体積もちがう（見た目で判断する）",
            "skills": [
                "imi-cmp",
                "imi-build",
                "rev-same",
                "big-one",
                "yoseki-stone"
            ]
        }
    ]
};
//# sourceMappingURL=taiseki.js.map