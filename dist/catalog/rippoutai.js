export const rippoutai = {
    "app_id": "rippoutai",
    "title": "直方体と立方体",
    "subject": "算数",
    "grade": 4,
    "url": "https://syo4-tyokuhoutaitorippoutai.vercel.app",
    "generated_at": "2026-10-15",
    "skill_count": 31,
    "modules": [
        {
            "module_id": "kousei",
            "title": "面・辺・頂点",
            "skills": [
                {
                    "skill_id": "kousei-sort",
                    "label": "① 直方体？ 立方体？",
                    "desc": "面の 形で 見分けよう",
                    "answer_kind": "steps"
                },
                {
                    "skill_id": "kousei-cube",
                    "label": "② 立方体の 面・辺・頂点",
                    "desc": "面の 形と 数を 数えよう",
                    "answer_kind": "steps"
                },
                {
                    "skill_id": "kousei-cuboid",
                    "label": "③ 直方体の 面と 辺",
                    "desc": "同じ 形の 面・等しい 辺",
                    "answer_kind": "num"
                },
                {
                    "skill_id": "kousei-higo",
                    "label": "④ ひごと ねん土玉",
                    "desc": "辺と 頂点で 形を 作る",
                    "answer_kind": "num"
                },
                {
                    "skill_id": "kousei-paper",
                    "label": "⑤ あつ紙で 箱を 作る",
                    "desc": "どの 面を 何まい？",
                    "answer_kind": "steps"
                }
            ]
        },
        {
            "module_id": "heiko",
            "title": "平行と 垂直",
            "skills": [
                {
                    "skill_id": "heiko-face",
                    "label": "① 面と 面",
                    "desc": "平行な 面・垂直な 面",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "heiko-edge",
                    "label": "② 辺と 辺の 平行",
                    "desc": "平行な 辺を 全部 さがそう",
                    "answer_kind": "multi"
                },
                {
                    "skill_id": "heiko-edgeperp",
                    "label": "③ 辺と 辺の 垂直",
                    "desc": "直角に 交わる 辺",
                    "answer_kind": "multi"
                },
                {
                    "skill_id": "heiko-faceedge",
                    "label": "④ 面と 辺",
                    "desc": "面に 垂直な 辺・平行な 辺",
                    "answer_kind": "multi"
                }
            ]
        },
        {
            "module_id": "tenkai",
            "title": "展開図",
            "skills": [
                {
                    "skill_id": "tenkai-cubeok",
                    "label": "① 立方体に なる？",
                    "desc": "組み立てを 考えよう",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "tenkai-cube",
                    "label": "② 立方体の 展開図を かく",
                    "desc": "たりない 面を 足そう",
                    "answer_kind": "paint"
                },
                {
                    "skill_id": "tenkai-cuboid",
                    "label": "③ 直方体の 展開図を かく",
                    "desc": "辺の 長さを そろえて",
                    "answer_kind": "paint"
                },
                {
                    "skill_id": "tenkai-face",
                    "label": "④ 平行な 面・垂直な 面",
                    "desc": "組み立てると 向かい合う 面は？",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "tenkai-point",
                    "label": "⑤ 重なる 点",
                    "desc": "組み立てると どの 点と 重なる？",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "tenkai-edge",
                    "label": "⑥ 重なる 辺",
                    "desc": "組み立てると どの 辺と 重なる？",
                    "answer_kind": "choice"
                }
            ]
        },
        {
            "module_id": "mitori",
            "title": "見取図",
            "skills": [
                {
                    "skill_id": "mitori-count",
                    "label": "① 見取図を 読む",
                    "desc": "見える 辺・見えない 辺",
                    "answer_kind": "num"
                },
                {
                    "skill_id": "mitori-hidden",
                    "label": "② 見えない 辺を 点線に",
                    "desc": "タップして 点線に しよう",
                    "answer_kind": "dash"
                },
                {
                    "skill_id": "mitori-draw",
                    "label": "③ 見取図の 続きを かく",
                    "desc": "点を むすんで 辺を かこう",
                    "answer_kind": "sketch"
                }
            ]
        },
        {
            "module_id": "ichi",
            "title": "位置の 表し方",
            "skills": [
                {
                    "skill_id": "ichi-read",
                    "label": "① 点の 位置を 表す",
                    "desc": "（横 ○cm、たて ○cm）",
                    "answer_kind": "num"
                },
                {
                    "skill_id": "ichi-plot",
                    "label": "② 点を かく",
                    "desc": "位置から 点を かこう",
                    "answer_kind": "point"
                },
                {
                    "skill_id": "ichi-space",
                    "label": "③ 空間の 位置",
                    "desc": "（横・たて・高さ）で 表そう",
                    "answer_kind": "num"
                }
            ]
        },
        {
            "module_id": "katsuyo",
            "title": "いかそう",
            "skills": [
                {
                    "skill_id": "katsuyo-ribbon",
                    "label": "① リボンの 長さ",
                    "desc": "何cm あれば いい？",
                    "answer_kind": "num"
                },
                {
                    "skill_id": "katsuyo-ribbonnet",
                    "label": "② リボンの 線を 展開図に",
                    "desc": "真ん中を 通る 直線",
                    "answer_kind": "sketch"
                }
            ]
        },
        {
            "module_id": "error",
            "title": "エラーハンター",
            "skills": [
                {
                    "skill_id": "eh-edges",
                    "label": "① 見えて いる ものだけ 数えた",
                    "desc": "見えない 辺や 頂点も ある",
                    "answer_kind": "steps"
                },
                {
                    "skill_id": "eh-face",
                    "label": "② 同じ形の 面を 1つと した",
                    "desc": "向かい合う 面も 同じ 形",
                    "answer_kind": "steps"
                },
                {
                    "skill_id": "eh-hidden",
                    "label": "③ 見えない 辺を 実線で かいた",
                    "desc": "見取図の 約束",
                    "answer_kind": "steps"
                },
                {
                    "skill_id": "eh-net",
                    "label": "④ 6つ つながれば 展開図？",
                    "desc": "組み立てて たしかめよう",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "eh-overlap",
                    "label": "⑤ となりの 点が 重なる？",
                    "desc": "重なる 点の さがし方",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "eh-parallel",
                    "label": "⑥ 平行な 辺を 1本だけ",
                    "desc": "はなれた 辺も 平行",
                    "answer_kind": "multi"
                },
                {
                    "skill_id": "eh-perp",
                    "label": "⑦ 交わらない 辺を 垂直に",
                    "desc": "垂直は 交わる 辺",
                    "answer_kind": "steps"
                },
                {
                    "skill_id": "eh-ichi",
                    "label": "⑧ 横と たてを 逆に した",
                    "desc": "横が 先、たてが あと",
                    "answer_kind": "num"
                }
            ]
        }
    ],
    "misconceptions": [
        {
            "code": "誤概念①",
            "label": "見取図で 見えて いる 面・辺・頂点だけを 数える",
            "skills": [
                "kousei-cube",
                "kousei-higo",
                "mitori-count",
                "eh-edges"
            ]
        },
        {
            "code": "誤概念②",
            "label": "直方体の 向かい合う 面が 同じ形だと 気づかない（同じ形の面を1つと数える）",
            "skills": [
                "kousei-cuboid",
                "kousei-paper",
                "eh-face"
            ]
        },
        {
            "code": "誤概念③",
            "label": "見取図で 見えない 辺を 実線で かく／点線に しない",
            "skills": [
                "mitori-hidden",
                "mitori-draw",
                "eh-hidden"
            ]
        },
        {
            "code": "誤概念④",
            "label": "正方形が 6つ つながれば 立方体の 展開図に なると思う",
            "skills": [
                "tenkai-cubeok",
                "tenkai-cube",
                "eh-net"
            ]
        },
        {
            "code": "誤概念⑤",
            "label": "組み立てたとき 重なる 点を、同じ辺の となりの点と 思う",
            "skills": [
                "tenkai-point",
                "tenkai-edge",
                "eh-overlap"
            ]
        },
        {
            "code": "誤概念⑥",
            "label": "平行な 辺を 同じ面の上だけで さがす（はなれた辺を見落とす）",
            "skills": [
                "heiko-edge",
                "heiko-faceedge",
                "eh-parallel"
            ]
        },
        {
            "code": "誤概念⑦",
            "label": "交わらない（ねじれの位置の）辺を 垂直と 思う",
            "skills": [
                "heiko-edgeperp",
                "eh-perp"
            ]
        },
        {
            "code": "誤概念⑧",
            "label": "位置の表し方で 横と たての 順を 逆に する",
            "skills": [
                "ichi-read",
                "ichi-plot",
                "ichi-space",
                "eh-ichi"
            ]
        }
    ]
};
//# sourceMappingURL=rippoutai.js.map