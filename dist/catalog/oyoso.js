export const oyoso = {
    "app_id": "oyoso",
    "title": "およその形と大きさ",
    "subject": "算数",
    "grade": 6,
    "url": "https://syo6-oyosonokatatitoookisa.vercel.app",
    "generated_at": "2026-10-10",
    "skill_count": 25,
    "modules": [
        {
            "module_id": "mitate",
            "title": "みたてる",
            "skills": [
                {
                    "skill_id": "mitate-shape",
                    "label": "① 形を みたてる",
                    "desc": "池や島を、どの形と みるとよいか えらぶ",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "mitate-solid",
                    "label": "② 立体を みたてる",
                    "desc": "かばんや ケーキを、どの立体と みるか えらぶ",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "mitate-shiki",
                    "label": "③ 式を えらぶ",
                    "desc": "みたてた形の 面積の式を えらぶ",
                    "answer_kind": "choice"
                }
            ]
        },
        {
            "module_id": "grid",
            "title": "方眼で 見積もる",
            "skills": [
                {
                    "skill_id": "grid-count",
                    "label": "① 方眼を 数える",
                    "desc": "1目もり 1cm。全部＝1cm²、かかる＝0.5cm²",
                    "answer_kind": "grid-count"
                },
                {
                    "skill_id": "grid-scale",
                    "label": "② 1目もりが 10m や 2km",
                    "desc": "1マスの面積を もとめてから かける",
                    "answer_kind": "grid-count"
                }
            ]
        },
        {
            "module_id": "area",
            "title": "およその 面積",
            "skills": [
                {
                    "skill_id": "area-rect",
                    "label": "① 長方形と みる",
                    "desc": "たて × よこ",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "area-tri",
                    "label": "② 三角形と みる",
                    "desc": "底辺 × 高さ ÷ 2",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "area-trap",
                    "label": "③ 台形と みる",
                    "desc": "（上底 ＋ 下底）× 高さ ÷ 2",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "area-para",
                    "label": "④ 平行四辺形と みる",
                    "desc": "底辺 × 高さ（ななめの辺に 注意）",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "area-circle",
                    "label": "⑤ 円と みる",
                    "desc": "半径 × 半径 × 3.14（直径に 注意）",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "area-compare",
                    "label": "⑥ 広さを くらべる",
                    "desc": "ちがう形と みた 2つの 広さを くらべる",
                    "answer_kind": "steps"
                }
            ]
        },
        {
            "module_id": "volume",
            "title": "およその 体積・容積",
            "skills": [
                {
                    "skill_id": "vol-cuboid",
                    "label": "① 直方体と みる",
                    "desc": "たて × よこ × 高さ",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "vol-cylinder",
                    "label": "② 円柱と みる",
                    "desc": "底面積（半径×半径×3.14）× 高さ",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "vol-prism",
                    "label": "③ 三角柱と みる",
                    "desc": "底面積（底辺×高さ÷2）× 高さ",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "vol-capacity",
                    "label": "④ 容積（何L入る？）",
                    "desc": "内のりで 計算して L に なおす",
                    "answer_kind": "number-steps"
                }
            ]
        },
        {
            "module_id": "map",
            "title": "地図と 縮尺",
            "skills": [
                {
                    "skill_id": "map-length",
                    "label": "① 実際の きょり",
                    "desc": "地図上の長さ × 縮尺の分母",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "map-area-rect",
                    "label": "② 長方形と みて 面積",
                    "desc": "長さを 実際に なおしてから かける",
                    "answer_kind": "number-steps"
                },
                {
                    "skill_id": "map-area-shape",
                    "label": "③ 三角形・台形と みて 面積",
                    "desc": "長さを 実際に なおしてから 公式",
                    "answer_kind": "number-steps"
                },
                {
                    "skill_id": "map-bar",
                    "label": "④ 目もり（ものさし）の 縮尺",
                    "desc": "地図の 1cm が 実際の何m かを 読む",
                    "answer_kind": "number-steps"
                }
            ]
        },
        {
            "module_id": "error-hunter",
            "title": "エラーハンター",
            "skills": [
                {
                    "skill_id": "eh-half",
                    "label": "① ÷2 の わすれ",
                    "desc": "三角形・台形の 面積",
                    "answer_kind": "steps"
                },
                {
                    "skill_id": "eh-diameter",
                    "label": "② 半径と 直径",
                    "desc": "円の 面積",
                    "answer_kind": "steps"
                },
                {
                    "skill_id": "eh-grid",
                    "label": "③ 方眼の 数え方",
                    "desc": "かかっている方眼は 半分",
                    "answer_kind": "steps"
                },
                {
                    "skill_id": "eh-scale",
                    "label": "④ 縮尺と 面積",
                    "desc": "長さを なおしてから 面積",
                    "answer_kind": "steps"
                },
                {
                    "skill_id": "eh-inner",
                    "label": "⑤ 外のりと 内のり",
                    "desc": "容積は 内のりで",
                    "answer_kind": "steps"
                },
                {
                    "skill_id": "eh-unit",
                    "label": "⑥ cm³ と L",
                    "desc": "1L ＝ 1000cm³",
                    "answer_kind": "steps"
                }
            ]
        }
    ],
    "misconceptions": [
        {
            "code": "誤概念①",
            "label": "三角形・台形の面積で ÷2 を わすれる",
            "skills": [
                "area-tri",
                "area-trap",
                "mitate-shiki",
                "vol-prism",
                "eh-half"
            ]
        },
        {
            "code": "誤概念②",
            "label": "円の面積で 直径を半径として使う／円周の式（直径×3.14）と まちがえる",
            "skills": [
                "area-circle",
                "mitate-shiki",
                "vol-cylinder",
                "eh-diameter"
            ]
        },
        {
            "code": "誤概念③",
            "label": "平行四辺形で 高さではなく ななめの辺を使う",
            "skills": [
                "area-para",
                "mitate-shiki"
            ]
        },
        {
            "code": "誤概念④",
            "label": "一部かかっている方眼を 1こ分と数える（0.5 とみない）",
            "skills": [
                "grid-count",
                "grid-scale",
                "eh-grid"
            ]
        },
        {
            "code": "誤概念⑤",
            "label": "地図上の面積に 縮尺の分母を1回だけかける（面積は 分母×分母 倍）",
            "skills": [
                "map-area-rect",
                "map-area-shape",
                "map-bar",
                "eh-scale"
            ]
        },
        {
            "code": "誤概念⑥",
            "label": "容積を 外のりで計算する",
            "skills": [
                "vol-capacity",
                "eh-inner"
            ]
        },
        {
            "code": "誤概念⑦",
            "label": "cm³ を L に なおすとき 1000 で わらない",
            "skills": [
                "vol-capacity",
                "eh-unit"
            ]
        },
        {
            "code": "誤概念⑧",
            "label": "見立てる形・立体の選びちがい（かどの数・平行な辺・底面の形を見ない）",
            "skills": [
                "mitate-shape",
                "mitate-solid"
            ]
        }
    ]
};
//# sourceMappingURL=oyoso.js.map