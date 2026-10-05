export const hirei = {
    "app_id": "hirei",
    "title": "比例と反比例",
    "subject": "算数",
    "grade": 6,
    "url": "https://syo6-hireitohannpirei.vercel.app",
    "generated_at": "2026-10-05",
    "skill_count": 30,
    "modules": [
        {
            "module_id": "kind",
            "title": "比例・反比例を 見分ける",
            "skills": [
                {
                    "skill_id": "kind-table",
                    "label": "① 比例しているか 見分ける（表）",
                    "desc": "x が 2倍で y も 2倍？ ふえるのに 比例ではない 表も あるよ",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "kind-three",
                    "label": "② 比例・反比例・どちらでもない（表）",
                    "desc": "y÷x と x×y を 計算して 見分けよう",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "kind-scene",
                    "label": "③ 場面の ことばから 見分ける",
                    "desc": "表が なくても、頭の中で 表に して 考えよう",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "kind-graph",
                    "label": "④ グラフから 見分ける",
                    "desc": "比例は 原点を 通る 直線、反比例は なめらかな 曲線",
                    "answer_kind": "choice-graph"
                }
            ]
        },
        {
            "module_id": "tbl",
            "title": "表の きまり",
            "skills": [
                {
                    "skill_id": "tbl-times",
                    "label": "① x が □倍 → y は？（比例）",
                    "desc": "x が 2倍、3倍…に なると y も 2倍、3倍…",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "tbl-frac",
                    "label": "② 0.5倍・2.5倍でも（比例）",
                    "desc": "小数の 倍でも 比例の きまりは なりたつ",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "tbl-fill",
                    "label": "③ 比例の 表を うめる",
                    "desc": "差ではなく、何倍かで 考えよう",
                    "answer_kind": "table"
                },
                {
                    "skill_id": "tbl-invtimes",
                    "label": "④ x が □倍 → y は？（反比例）",
                    "desc": "x が 2倍、3倍…に なると y は 1/2倍、1/3倍…",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "tbl-invfill",
                    "label": "⑤ 反比例の 表を うめる",
                    "desc": "x × y が いつも 同じ ことを 使おう",
                    "answer_kind": "table"
                }
            ]
        },
        {
            "module_id": "shiki",
            "title": "式に 表す",
            "skills": [
                {
                    "skill_id": "shiki-const",
                    "label": "① 比例の 決まった数（y÷x）",
                    "desc": "y ÷ x は いつも 同じ数",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "shiki-make",
                    "label": "② 比例の 式を つくる",
                    "desc": "y ＝ 決まった数 × x",
                    "answer_kind": "shiki"
                },
                {
                    "skill_id": "shiki-calc",
                    "label": "③ 比例の 式で 求める",
                    "desc": "x から y、y から x を 求めよう",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "shiki-invconst",
                    "label": "④ 反比例の 決まった数（x×y）",
                    "desc": "x × y は いつも 同じ数",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "shiki-invmake",
                    "label": "⑤ 反比例の 式を つくる",
                    "desc": "y ＝ 決まった数 ÷ x",
                    "answer_kind": "shiki"
                },
                {
                    "skill_id": "shiki-invcalc",
                    "label": "⑥ 反比例の 式で 求める",
                    "desc": "x から y、y から x を 求めよう",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "shiki-scene",
                    "label": "⑦ 場面から 式を つくる",
                    "desc": "比例か 反比例かを 見ぬいて 式に しよう",
                    "answer_kind": "choice+shiki"
                }
            ]
        },
        {
            "module_id": "graph",
            "title": "グラフ",
            "skills": [
                {
                    "skill_id": "graph-draw",
                    "label": "① 比例の グラフを かく",
                    "desc": "表の 組を 点に して、どんな 線に なるか 見よう",
                    "answer_kind": "plot"
                },
                {
                    "skill_id": "graph-read",
                    "label": "② 比例の グラフを 読む",
                    "desc": "x から y、y から x を 読みとろう",
                    "answer_kind": "number"
                },
                {
                    "skill_id": "graph-shiki",
                    "label": "③ グラフから 式を 求める",
                    "desc": "x が 1 の ときの y を 読もう",
                    "answer_kind": "shiki"
                },
                {
                    "skill_id": "graph-two",
                    "label": "④ 2本の グラフを くらべる",
                    "desc": "どちらが はやい？ 何m はなれている？",
                    "answer_kind": "choice+number"
                },
                {
                    "skill_id": "graph-invdraw",
                    "label": "⑤ 反比例の グラフを かく",
                    "desc": "点を とると なめらかな 曲線に ならぶ",
                    "answer_kind": "plot"
                }
            ]
        },
        {
            "module_id": "use",
            "title": "比例・反比例を 使う",
            "skills": [
                {
                    "skill_id": "use-weight",
                    "label": "① 重さで 数える",
                    "desc": "全部 数えないで、重さで 用意しよう",
                    "answer_kind": "choice+number"
                },
                {
                    "skill_id": "use-shadow",
                    "label": "② かげで 高さを 求める",
                    "desc": "はかれない 高さを、かげの 長さで",
                    "answer_kind": "choice+number"
                },
                {
                    "skill_id": "use-speed",
                    "label": "③ 道のりと 時間",
                    "desc": "同じ 速さなら、道のりは 時間に 比例",
                    "answer_kind": "choice+number"
                },
                {
                    "skill_id": "use-inv",
                    "label": "④ 反比例を 使う",
                    "desc": "歯車・速さと 時間・分ける 人数",
                    "answer_kind": "choice+number"
                }
            ]
        },
        {
            "module_id": "eh",
            "title": "エラーハンター",
            "skills": [
                {
                    "skill_id": "eh-additive",
                    "label": "① 差で 考えた まちがい",
                    "desc": "x が 2 ふえたから y も 2 ふやした…？",
                    "answer_kind": "choice+number"
                },
                {
                    "skill_id": "eh-incdec",
                    "label": "② 「ふえる＝比例」の まちがい",
                    "desc": "ふえる・へる だけで 決めていない？",
                    "answer_kind": "choice"
                },
                {
                    "skill_id": "eh-line",
                    "label": "③ 「直線＝比例」の まちがい",
                    "desc": "原点を 通っているか 見よう",
                    "answer_kind": "choice-graph"
                },
                {
                    "skill_id": "eh-invmix",
                    "label": "④ 反比例を 比例と まぜた まちがい",
                    "desc": "反比例なのに 2倍に した…？",
                    "answer_kind": "choice+number"
                },
                {
                    "skill_id": "eh-const",
                    "label": "⑤ 決まった数の まちがい",
                    "desc": "決まった数は y ÷ x",
                    "answer_kind": "choice+number"
                }
            ]
        }
    ],
    "misconceptions": [
        {
            "code": "誤概念①",
            "label": "差で考える（加法的方略）。x が 2 ふえたから y も 2 ふやす",
            "skills": [
                "tbl-fill",
                "tbl-frac",
                "use-weight",
                "use-shadow",
                "use-speed",
                "eh-additive"
            ]
        },
        {
            "code": "誤概念②",
            "label": "ふえれば比例・へれば反比例と決めつける（何倍かを見ない）",
            "skills": [
                "kind-table",
                "kind-three",
                "kind-scene",
                "eh-incdec"
            ]
        },
        {
            "code": "誤概念③",
            "label": "直線なら比例と考える（原点を通るかを見ない）／反比例のグラフを直線と思う",
            "skills": [
                "kind-graph",
                "graph-draw",
                "graph-invdraw",
                "eh-line"
            ]
        },
        {
            "code": "誤概念④",
            "label": "反比例を比例と同じに考える（x が 2倍で y も 2倍・決まった数を y÷x にする）",
            "skills": [
                "tbl-invtimes",
                "tbl-invfill",
                "shiki-invconst",
                "shiki-invmake",
                "use-inv",
                "eh-invmix"
            ]
        },
        {
            "code": "誤概念⑤",
            "label": "比例の決まった数を取りちがえる（x÷y・y－x・x が 1 でない列の y）",
            "skills": [
                "shiki-const",
                "shiki-make",
                "graph-shiki",
                "eh-const"
            ]
        }
    ]
};
//# sourceMappingURL=hirei.js.map