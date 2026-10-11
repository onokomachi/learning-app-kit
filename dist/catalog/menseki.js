export const menseki = {
    "app_id": "menseki",
    "title": "図形の面積",
    "subject": "算数",
    "grade": 5,
    "url": "https://syo5-zukeinomennseki.vercel.app",
    "generated_at": "2026-10-11",
    "skill_count": 40,
    "modules": [
        {
            "module_id": "base",
            "title": "底辺と高さ",
            "skills": [
                {
                    "skill_id": "base-para-pick",
                    "label": "① 平行四辺形の 高さは どれ？",
                    "desc": "底辺に 垂直な 線を えらぼう",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "base-tri-pick",
                    "label": "② 三角形の 高さは どれ？",
                    "desc": "高さが 外に なることも あるよ",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "base-foot",
                    "label": "③ 高さを かこう",
                    "desc": "垂直な 線の 足を タップ",
                    "answer_kind": "footTap"
                },
                {
                    "skill_id": "base-which",
                    "label": "④ 面積に つかう 長さは？",
                    "desc": "斜めの 辺は つかわない！",
                    "answer_kind": "multi"
                },
                {
                    "skill_id": "base-swap",
                    "label": "⑤ 底辺を かえると 高さは？",
                    "desc": "底辺が かわると 高さも かわる",
                    "answer_kind": "number"
                }
            ]
        },
        {
            "module_id": "para",
            "title": "平行四辺形の面積",
            "skills": [
                {
                    "skill_id": "para-cut",
                    "label": "① 切って 長方形に",
                    "desc": "公式の しくみを じゅんばんに",
                    "answer_kind": "order"
                },
                {
                    "skill_id": "para-area",
                    "label": "② 面積を もとめよう",
                    "desc": "底辺 × 高さ",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "para-slant",
                    "label": "③ 斜めの 辺も 書いてある",
                    "desc": "どの 長さを つかう？",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "para-out",
                    "label": "④ 高さが 外に ある",
                    "desc": "傾きが 大きい 平行四辺形",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "para-dec",
                    "label": "⑤ 小数の 平行四辺形",
                    "desc": "小数 × 整数の けいさん",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "para-rev",
                    "label": "⑥ 面積から 底辺・高さ",
                    "desc": "□ × 高さ ＝ 面積",
                    "answer_kind": "number"
                }
            ]
        },
        {
            "module_id": "tri",
            "title": "三角形の面積",
            "skills": [
                {
                    "skill_id": "tri-why",
                    "label": "① なぜ ÷2 なの？",
                    "desc": "2つ 合わせると 平行四辺形",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "tri-area",
                    "label": "② 面積を もとめよう",
                    "desc": "底辺 × 高さ ÷ 2",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "tri-obt",
                    "label": "③ 高さが 外に ある",
                    "desc": "鈍角の 三角形",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "tri-slant",
                    "label": "④ 3つの 辺が 書いてある",
                    "desc": "底辺と 高さを みつけよう",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "tri-dec",
                    "label": "⑤ 小数の 三角形",
                    "desc": "小数でも 公式は 同じ",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "tri-rev",
                    "label": "⑥ 面積から 底辺・高さ",
                    "desc": "÷2 を もとに もどす",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "tri-same",
                    "label": "⑦ 面積が 同じ 三角形",
                    "desc": "頂点を 平行に 動かす",
                    "answer_kind": "multi"
                }
            ]
        },
        {
            "module_id": "trap",
            "title": "台形の面積",
            "skills": [
                {
                    "skill_id": "trap-parts",
                    "label": "① 上底・下底・高さ",
                    "desc": "台形の 部品を 見分けよう",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "trap-expr",
                    "label": "② 公式を 式に しよう",
                    "desc": "（上底 ＋ 下底）× 高さ ÷ 2",
                    "answer_kind": "exprBuild"
                },
                {
                    "skill_id": "trap-area",
                    "label": "③ 面積を もとめよう",
                    "desc": "台形の 面積",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "trap-dec",
                    "label": "④ 小数の 台形",
                    "desc": "小数でも 公式は 同じ",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "trap-rev",
                    "label": "⑤ 面積から 高さ・下底",
                    "desc": "公式を 逆に つかう",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "trap-two",
                    "label": "⑥ 2つの 三角形に 分けて",
                    "desc": "別の もとめ方",
                    "answer_kind": "choice"
                }
            ]
        },
        {
            "module_id": "rhom",
            "title": "ひし形の面積",
            "skills": [
                {
                    "skill_id": "rhom-why",
                    "label": "① なぜ ÷2 なの？",
                    "desc": "対角線の 長方形の 半分",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "rhom-area",
                    "label": "② 面積を もとめよう",
                    "desc": "対角線 × 対角線 ÷ 2",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "rhom-sq",
                    "label": "③ 正方形の 面積",
                    "desc": "対角線だけで もとめる",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "rhom-rev",
                    "label": "④ 面積から 対角線",
                    "desc": "公式を 逆に つかう",
                    "answer_kind": "number"
                }
            ]
        },
        {
            "module_id": "ex",
            "title": "面積の くふう",
            "skills": [
                {
                    "skill_id": "ex-add",
                    "label": "① 分けて たす",
                    "desc": "長方形や 三角形に 分けよう",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "ex-sub",
                    "label": "② 大きい 形から ひく",
                    "desc": "くりぬき・角切りの 図形",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "ex-move",
                    "label": "③ 道を よせて もとめる",
                    "desc": "道を はしに 動かして 考えよう",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "ex-expr",
                    "label": "④ 式から 図を よむ",
                    "desc": "正しい 式は どれ？",
                    "answer_kind": "choice"
                }
            ]
        },
        {
            "module_id": "rel",
            "title": "高さと面積の関係",
            "skills": [
                {
                    "skill_id": "rel-table",
                    "label": "① 高さと 面積の 表",
                    "desc": "高さが ふえると 面積は？",
                    "answer_kind": "tableFill"
                },
                {
                    "skill_id": "rel-times",
                    "label": "② 高さが ○倍なら",
                    "desc": "面積は 何倍？",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "rel-same",
                    "label": "③ 同じ 面積の 三角形を かく",
                    "desc": "頂点を タップ",
                    "answer_kind": "apexTap"
                },
                {
                    "skill_id": "rel-cmp",
                    "label": "④ どれが 広い？",
                    "desc": "見た目に だまされない",
                    "answer_kind": "choice"
                }
            ]
        },
        {
            "module_id": "use",
            "title": "くらしの面積",
            "skills": [
                {
                    "skill_id": "use-unit",
                    "label": "① 面積の 単位",
                    "desc": "m² と cm²",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "use-land",
                    "label": "② 土地の 広さ",
                    "desc": "畑・花だん・池の 面積",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "use-rev",
                    "label": "③ 面積から 高さ",
                    "desc": "広さが きまっている 土地",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "use-perim",
                    "label": "④ まわりの長さと 面積",
                    "desc": "ちがいを はっきり",
                    "answer_kind": "number"
                }
            ]
        }
    ],
    "misconceptions": [
        {
            "code": "誤概念①",
            "label": "斜めの辺の長さを高さだと思う",
            "skills": [
                "base-para-pick",
                "base-tri-pick",
                "base-which",
                "para-slant",
                "tri-slant",
                "eh-slant",
                "eh-height"
            ]
        },
        {
            "code": "誤概念②",
            "label": "÷2をわすれる（三角形・台形・ひし形）",
            "skills": [
                "tri-area",
                "tri-why",
                "tri-rev",
                "trap-expr",
                "trap-area",
                "rhom-why",
                "rhom-area",
                "rhom-rev",
                "eh-half"
            ]
        },
        {
            "code": "誤概念③",
            "label": "台形で上底と下底をたさない（かけてしまう）",
            "skills": [
                "trap-parts",
                "trap-expr",
                "trap-area",
                "trap-two",
                "trap-rev",
                "eh-trap"
            ]
        },
        {
            "code": "誤概念④",
            "label": "ひし形の面積に辺の長さを使う",
            "skills": [
                "rhom-why",
                "rhom-area",
                "rhom-sq",
                "eh-diag"
            ]
        },
        {
            "code": "誤概念⑤",
            "label": "高さが図形の外にあると見つけられない",
            "skills": [
                "base-tri-pick",
                "base-foot",
                "para-out",
                "tri-obt"
            ]
        },
        {
            "code": "誤概念⑥",
            "label": "まわりの長さと面積を混同する",
            "skills": [
                "use-perim",
                "para-slant",
                "eh-perim"
            ]
        },
        {
            "code": "誤概念⑦",
            "label": "面積の単位をとりちがえる（cm²とm²を100倍で考える）",
            "skills": [
                "use-unit",
                "use-land",
                "eh-unit"
            ]
        },
        {
            "code": "誤概念⑧",
            "label": "形がちがえば面積もちがう・辺が長いほど広いと思う",
            "skills": [
                "tri-same",
                "rel-same",
                "rel-cmp"
            ]
        },
        {
            "code": "誤概念⑨",
            "label": "高さがふえた分（差）だけ面積もふえると考える",
            "skills": [
                "rel-table",
                "rel-times"
            ]
        },
        {
            "code": "誤概念⑩",
            "label": "組み合わせた図形で、たす・ひくを取りちがえる",
            "skills": [
                "ex-add",
                "ex-sub",
                "ex-move",
                "ex-expr"
            ]
        }
    ]
};
//# sourceMappingURL=menseki.js.map