# learning-app-kit

単元学習アプリ（小・中学校）の共通基盤。単元ごとにコピーして作り直していた「検証」と、
どのアプリにも無かった「間隔反復」を、1箇所で持つ。

| パッケージ | 中身 |
|---|---|
| `learning-app-kit/review` | 間隔反復スケジューラ（Leitner 簡易版。純粋関数） |
| `learning-app-kit/verify` | 問題ジェネレーターの汎用プロパティ検査・構成検査・カバレッジ監査 |
| `templates/workflows/check.yml` | アプリ用 CI（`fix` で全アプリに配る） |

依存なし・React 非依存。TypeScript の型定義つき。

## インストール

```bash
npm install https://github.com/onokomachi/learning-app-kit/archive/acac3d2608976f854d0706404d6b9222dc16e50b.tar.gz
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

## platform — 学級ポータルのルール点検

新しいアプリは、作りはじめに1回だけ:

```bash
npx learning-app-kit-platform init math   # math / kokugo / portal / standalone
```

これで次がそろう（あとは `fix` が保つ）:

- `package.json` の `"learningApp": { "family": ... }`、`scripts.platform`・`scripts.prebuild`（Vercel の build の前に点検）・`scripts.check`
- `CLAUDE.md`（上の段はアプリだけのこと、下の段は `platform/CLAUDE.common.md` の共通ルール）
- 種類ごとの共通ファイル（`platform/families/<種類>/files/`）
- CI `.github/workflows/check.yml`（`templates/workflows/check.yml`）

```bash
npx learning-app-kit-platform check    # ずれがあれば失敗（CI・Vercel の build 前・各セッションの npm run check で走る）
npx learning-app-kit-platform fix      # kit の版にそろえる（CLAUDE.md のアプリだけの段は残す）
npx learning-app-kit-platform watch    # kit の最新より古ければ失敗
npx learning-app-kit-platform update   # kit を最新に上げて fix（CI が週1回動かし、check が通れば PR にする）
```

共通ファイルを1つのアプリだけで直すと直しがほかに届かない（おまかせモードの不具合が4アプリで別々に直され、
5アプリで残っていた）ので、CI と Vercel の build 前で止める。

週1回の自動更新（毎週月曜 7:00 JST）は、各アプリの CI が `update` で kit を最新に上げ、`npm run check` が通れば
main に直接反映する（Vercel が本番に出す）。通らなければ反映せず、GitHub が持ち主にメールする。
リポジトリの設定変更も、トークンの登録も要らない。CI の設定ファイル（`.github/workflows`）が変わる更新だけは
GitHub の決まりで Actions から書きこめないので、反映せずにメールで知らせる（全体セッションで直す）。
kit の変更は全アプリに月曜の朝いっせいに届くので、kit の PR には「ほかのアプリへの影響」を書く。

## 開発

```bash
npm ci
npm run check   # build + test
```
