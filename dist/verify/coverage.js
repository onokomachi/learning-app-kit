/** 全スキルぶん生成してサンプルを集め、バリエーション数（signature の種類）を検査する */
export function collectSamples(r, a) {
    const n = a.n ?? Number(process.env.N ?? 4000);
    const min = a.minVariations ?? 20;
    r.section(`バリエーション数（各レベル ${n} 回生成 / 目標 ${min} 通り以上）`);
    const samples = {};
    for (const skill of a.skillIds) {
        const list = [];
        const sigs = new Set();
        for (let i = 0; i < n; i++) {
            const p = a.generate(skill);
            list.push(p);
            sigs.add(p.signature);
        }
        samples[skill] = list;
        const ok = sigs.size >= min;
        if (!ok)
            r.failures++;
        console.log(`  ${ok ? '✓' : '✗'} ${skill.padEnd(16)} ${String(sigs.size).padStart(5)} 通り`);
    }
    return samples;
}
/** 「どんな形が出るか」を、名前つきの述語で数える。0件は失敗 */
export function checkShapes(r, all, checks, title = '出題される「形」の監査（0件は設計上の欠落として失敗あつかい）') {
    r.section(title);
    const width = Math.max(...Object.keys(checks).map((k) => k.length), 20);
    for (const [name, fn] of Object.entries(checks)) {
        const n = all.filter(fn).length;
        if (n === 0)
            r.failures++;
        console.log(`  ${n === 0 ? '✗' : '✓'} ${name.padEnd(width)} ${String(n).padStart(6)} 件`);
    }
}
/** 解答UIの種類がすべて出るか（数値入力だけで代用していないか） */
export function checkAnswerKinds(r, all, kinds) {
    r.section('解答UIの種類');
    for (const k of kinds) {
        const n = all.filter((p) => p.answer.kind === k).length;
        if (n === 0)
            r.failures++;
        console.log(`  ${n === 0 ? '✗' : '✓'} ${k.padEnd(12)} ${String(n).padStart(6)} 件`);
    }
}
/** 本番テストの配点（モジュール別）。1問も出ないモジュールは失敗 */
export function checkTestPoints(r, a) {
    r.section('本番テストの配点（モジュール別）');
    const pts = new Map();
    const modOf = (id) => Object.entries(a.moduleLevels).find(([, ls]) => ls.some((l) => l.id === id))?.[0];
    for (const s of a.testSteps) {
        for (const id of s.pool) {
            const mod = modOf(id);
            if (!mod)
                continue;
            pts.set(mod, (pts.get(mod) ?? 0) + s.points / s.pool.length);
        }
    }
    for (const m of a.modules) {
        const v = pts.get(m.id) ?? 0;
        if (v === 0) {
            r.failures++;
            console.log(`  ✗ ${m.title.padEnd(14)} 0点（本番テストに1問も出ない）`);
        }
        else {
            console.log(`  ✓ ${m.title.padEnd(14)} ${v.toFixed(1).padStart(6)}点 (${((v / a.totalMax) * 100).toFixed(1)}%)`);
        }
    }
}
//# sourceMappingURL=coverage.js.map