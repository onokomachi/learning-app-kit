/** 数値が「独立した数」として文字列に出てくるか（"150" に "50" が含まれる誤検出を防ぐ） */
export function containsNumber(text, n) {
    const esc = String(n).replace(/\./g, '\\.');
    return new RegExp(`(?<!\\d)${esc}(?!\\d)`).test(text);
}
function isUniq(a) {
    return new Set(a).size === a.length;
}
/** 1問ぶんの共通検査（問題文・解説・ラベル・署名・ヒント段数） */
export function checkCommon(r, skill, p, o = {}) {
    const hintsCount = o.hintsCount ?? 3;
    if (p.skillId !== skill)
        r.fail(skill, `skillId がちがう: ${p.skillId}`);
    if (!p.prompt || p.prompt.length < 4)
        r.fail(skill, '問題文が空', p);
    if (!p.explain || p.explain.length < 4)
        r.fail(skill, '解説が空', p);
    if (!p.label)
        r.fail(skill, 'label が空', p);
    if (!p.signature)
        r.fail(skill, 'signature が空', p);
    if (p.hints.length !== hintsCount || p.hints.some((h) => !h || h.length < 4)) {
        r.fail(skill, `ヒントが${hintsCount}段そろっていない`, p);
    }
}
/** 解答UIの種類ごとの検査。未知の kind は素通し（アプリ側で extra を足す） */
export function checkAnswerSpec(r, skill, p, o = {}) {
    const minChoices = o.minChoices ?? 3;
    const leakIdx = o.hintsMustNotLeak ?? [0];
    const a = p.answer;
    const qtext = `${p.story ?? ''} ${p.prompt}`;
    switch (a.kind) {
        case 'number': {
            const c = a.correct;
            if (!Number.isFinite(c))
                r.fail(skill, `答えが数でない: ${c}`, p);
            if (!a.decimal && !Number.isInteger(c))
                r.fail(skill, `答えが整数でない: ${c}`, p);
            if (!o.allowNegative && c < 0)
                r.fail(skill, `答えが負: ${c}`, p);
            if (containsNumber(qtext, c))
                r.fail(skill, `答え(${c})が問題文からそのまま拾える`, p);
            if (p.diagnose && p.diagnose(c) !== null)
                r.fail(skill, '正答に対して誤答診断が反応している', p);
            for (const i of leakIdx) {
                const h = p.hints[i];
                if (h && containsNumber(h, c))
                    r.fail(skill, `ヒント${i + 1}が答え(${c})を書いている`, p);
            }
            break;
        }
        case 'choice': {
            const choices = a.choices;
            const c = a.correct;
            if (c < 0 || c >= choices.length)
                r.fail(skill, '正解の index が範囲外', p);
            if (!isUniq(choices))
                r.fail(skill, `選択肢が重複: ${choices.join(' / ')}`, p);
            if (choices.length < minChoices)
                r.fail(skill, `選択肢が少なすぎる (${choices.length})`, p);
            break;
        }
        case 'multi': {
            const choices = a.choices;
            const c = a.correct;
            if (!isUniq(choices))
                r.fail(skill, '選択肢が重複', p);
            if (c.length === 0)
                r.fail(skill, '正解が0個', p);
            if (c.some((i) => i < 0 || i >= choices.length))
                r.fail(skill, '正解 index が範囲外', p);
            break;
        }
        case 'tableFill': {
            const xs = a.xs;
            const given = a.given;
            const correct = a.correct;
            if (correct.length !== xs.length || given.length !== xs.length)
                r.fail(skill, '表の列数が合わない', p);
            correct.forEach((v, i) => {
                if (!Number.isInteger(v))
                    r.fail(skill, `表の値が整数でない: ${v}`, p);
                if (!o.allowNegative && v < 0)
                    r.fail(skill, `表の値が負: ${v}（${a.xHeader}=${xs[i]}）`, p);
                if (given[i] !== null && given[i] !== v)
                    r.fail(skill, '見せている値と正解が食いちがう', p);
            });
            if (given.every((g) => g !== null))
                r.fail(skill, 'あいているところが1つもない', p);
            break;
        }
        case 'graphPlot': {
            const correct = a.correct;
            const given = (a.given ?? []);
            if (correct.length === 0)
                r.fail(skill, '打つべき点が0個', p);
            correct.forEach((pt) => {
                if (pt.x < 0 || pt.x > a.xMax || pt.y < 0 || pt.y > a.yMax)
                    r.fail(skill, `点(${pt.x},${pt.y})が軸の外`, p);
                if (!Number.isInteger(pt.x) || !Number.isInteger(pt.y))
                    r.fail(skill, '点の座標が整数でない', p);
            });
            given.forEach((g) => {
                if (!correct.some((c) => c.x === g.x && c.y === g.y))
                    r.fail(skill, '例として打ってある点が正解に含まれない', p);
            });
            break;
        }
        case 'exprBuild': {
            const cards = a.cards;
            const correct = a.correct;
            const bag = [...cards];
            correct.forEach((tok) => {
                const at = bag.indexOf(tok);
                if (at < 0)
                    r.fail(skill, `正解のカード「${tok}」が候補にない`, p);
                else
                    bag.splice(at, 1);
            });
            if (cards.length <= correct.length)
                r.fail(skill, 'まちがいのカードが1枚もない', p);
            break;
        }
        case 'truth': {
            const rows = a.rows;
            if (rows.length < minChoices)
                r.fail(skill, `行が少なすぎる (${rows.length})`, p);
            if (o.truthNeedsBoth ?? true) {
                if (!rows.some((x) => x.correct))
                    r.fail(skill, '「正しい」の行がない（反例だけ）', p);
                if (!rows.some((x) => !x.correct))
                    r.fail(skill, '反例の行がない', p);
            }
            if (!isUniq(rows.map((x) => x.label)))
                r.fail(skill, '行が重複', p);
            if (rows.some((x) => !x.why))
                r.fail(skill, '理由が空の行がある', p);
            break;
        }
        case 'errorFix': {
            const fix = a.fixChoices;
            const reason = a.reasonChoices;
            if (!isUniq(fix))
                r.fail(skill, `なおす選択肢が重複: ${fix.join(' / ')}`, p);
            if (!isUniq(reason))
                r.fail(skill, 'りゆうの選択肢が重複', p);
            if (a.fixCorrect < 0 || a.fixCorrect >= fix.length)
                r.fail(skill, 'なおす正解 index が範囲外', p);
            if (a.reasonCorrect < 0 || a.reasonCorrect >= reason.length)
                r.fail(skill, 'りゆう正解 index が範囲外', p);
            if (fix.length < minChoices)
                r.fail(skill, `なおす選択肢が少なすぎる (${fix.length})`, p);
            if (reason.length < minChoices)
                r.fail(skill, `りゆうの選択肢が少なすぎる (${reason.length})`, p);
            if (fix.includes(a.wrongExpr))
                r.fail(skill, 'まちがいの式が「正しい式」の選択肢に混ざっている', p);
            if (fix[a.fixCorrect] === a.wrongExpr)
                r.fail(skill, '正解＝まちがいの式になっている', p);
            break;
        }
        default:
            // 未知の kind は extra 検査に任せる
            break;
    }
}
/** 全スキル × N 回 生成して checkCommon / checkAnswerSpec / extra を流す */
export function runPropertyTest(r, args) {
    const n = args.n ?? Number(process.env.N ?? 10000);
    r.section(`プロパティテスト（各スキル ${n} 回生成）`);
    for (const skill of args.skillIds) {
        const before = r.failures;
        for (let i = 0; i < n; i++) {
            const p = args.generate(skill);
            checkCommon(r, skill, p, args.options);
            checkAnswerSpec(r, skill, p, args.options);
            args.extra?.(r, skill, p);
        }
        const d = r.failures - before;
        console.log(`  ${d === 0 ? '✓' : '✗'} ${skill.padEnd(16)} ${d === 0 ? 'OK' : `${d} 件の失敗`}`);
    }
}
//# sourceMappingURL=checks.js.map