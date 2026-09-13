# learning-app-kit

単元学習アプリ（小・中学校）の共通基盤。単元ごとにコピーして作り直していた「検証」と、
どのアプリにも無かった「間隔反復」を、1箇所で持つ。

| パッケージ | 中身 |
|---|---|
| `learning-app-kit/review` | 間隔反復スケジューラ（Leitner 簡易版。純粋関数） |
| `learning-app-kit/verify` | 問題ジェネレーターの汎用プロパティ検査・構成検査・カバレッジ監査 |
| `templates/workflows/check.yml` | アプリ用 CI テンプレート |

依存なし・React 非依存。TypeScript の型定義つき。

## インストール

```bash
npm install https://github.com/onokomachi/learning-app-kit/archive/<コミットSHA>.tar.gz
```

**tarball URL を使う**。`github:` や `git+https:` の形で入れると、npm が lockfile の
`resolved` を `git+ssh://git@github.com/...` に正規化してしまい、SSH鍵の無い
GitHub Actions / Vercel で `npm ci` が失敗する（このリポジトリが Public でも起きる）。

tarball なら素の HTTPS だけで完結し、lockfile に integrity ハッシュも残る。
`dist/` はコミット済みなので、インストール側にビルド環境（TypeScript）は要らない。

## review — 間隔反復

Dunlosky et al. (2013) が「高い有用性」と判定した2手法のうちの1つ「間隔をあけて復習する」。
単元アプリは単元内で完結しがちで、いちど習熟したスキルが二度と出てこない。それを直す。

```ts
import { scheduleAfterResult, getDueSkills, inferInitialState } from 'learning-app-kit/review';

// 1問解いたあと（progressStore.recordResult の中など）
state.review[skillId] = scheduleAfterResult(state.review[skillId], correct);

// ホーム画面で「きょうの ふくしゅう」を出す
const due = getDueSkills(state.review, { limit: 3 });
```

間隔は既定で `1 → 3 → 7 → 14 → 30 日`。正解で1段上がり、ミスで最初に戻る。

既存の localStorage データ（習熟度だけ持っていて時刻が無い）を移行するときは
`inferInitialState(mastery, lastTs)` で妥当な初期状態を作れる。

## verify — 検証

アプリの型に依存しない（構造が合っていれば渡せる）。

```ts
// scripts/verify-problems.ts
import { Reporter, runPropertyTest, checkStructure } from 'learning-app-kit/verify';
import { ALL_SKILL_IDS, generate, MODULE_LEVELS } from '../src/lib/problems';
import { TEST_STEPS } from '../src/lib/testConfig';

const r = new Reporter();
runPropertyTest(r, { skillIds: ALL_SKILL_IDS, generate });
checkStructure(r, {
  skillIds: ALL_SKILL_IDS, moduleLevels: MODULE_LEVELS, generate,
  testSteps: TEST_STEPS, expectedSectionMax: { 表: 100, 裏: 50 },
});
process.exit(r.finish());
```

```ts
// scripts/coverage-audit.ts
import { Reporter, collectSamples, checkShapes, checkAnswerKinds, checkTestPoints } from 'learning-app-kit/verify';

const r = new Reporter();
const samples = collectSamples(r, { skillIds: ALL_SKILL_IDS, generate });
const all = Object.values(samples).flat();
checkShapes(r, all, {
  // ↓ ここだけ単元固有。教科書・県教委プリントに出る「形」を述語で書く
  '表に かきこむ': (p) => p.answer.kind === 'tableFill',
});
checkAnswerKinds(r, all, ['choice', 'number', 'tableFill']);
process.exit(r.finish('カバレッジ監査'));
```

検査している内容（master-DB の bugs/ で実際に起きた型）:

- 答えが 負・小数・NaN（未習の数）
- 選択肢の重複／正解 index の範囲外／選択肢が少なすぎる
- 答えが問題文からそのまま拾える
- ヒント1段目が答えを言い切っている
- 誤答診断が正答に反応する
- 表うめの見せ値と正解の食いちがい、空欄が無い
- 式づくりのカードに正解トークンが足りない
- 本番テストに一度も出ないレベル、レベル定義の重複、moduleId の不一致

## CI テンプレート

```bash
cp node_modules/learning-app-kit/templates/workflows/check.yml .github/workflows/check.yml
```

`package.json` に次があれば、そのまま動く:

```json
"check": "npm run lint && npm run build && npm run verify && npm run audit"
```

## 開発

```bash
npm ci
npm run check   # build + test
```
