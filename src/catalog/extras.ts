/**
 * カタログに載らない記号の辞書。
 *
 * 生成されたカタログ（<app_id>.ts）は MODULE_LEVELS だけを見ている。
 * ところがアプリは、レベル表に載っていない記号でも記録を送る:
 *
 *   - 本番テストモード      … 'mock-test'（1回ぶんの点数）
 *   - ボス戦                … 'boss-normal' / 'boss-hard' / 'boss-god'
 *   - エラーハンター        … 'eh-judge' / 'eh-fix' など、誤り例ごとの記号
 *   - 本番テストの大問      … 'hissan-3-2' のような、テスト用に切った難度
 *
 * これらが辞書に無いと、教師ダッシュボードで「カタログに無い記号」として
 * ひとまとめに積み上がる。記録は正しく届いているのに、意味だけが失われている状態で、
 * 実際にそれが起きていた。
 *
 * **ここは手で書く。** 生成されたカタログには手を入れない
 * （アプリ側の MODULE_LEVELS が正本のまま保てるように）。
 *
 * 単元の「レベル」ではないので skill_count には数えない。
 * 数えてしまうと「35スキル中いくつ」の分母が、練習していない遊び方のぶんだけ膨らむ。
 */
import type { ModuleEntry } from './types.js';

const k = (skill_id: string, label: string, desc: string, answer_kind = 'mixed') =>
  ({ skill_id, label, desc, answer_kind });

/**
 * どのアプリにもある遊び方。learning-game スキルのひな形に入っているため、
 * これから作るアプリでも同じ記号になる——だから全アプリに配っておく。
 * 使っていないアプリでは、その記号の記録が来ないだけで害はない。
 */
export const COMMON_EXTRA_MODULES: ModuleEntry[] = [
  {
    module_id: 'mock-test',
    title: '本番テストモード',
    skills: [
      k('mock-test', '本番テスト（1回ぶん）', '表・裏を通してやったテスト1回ぶんの点数', 'test'),
    ],
  },
  {
    module_id: 'boss-battle',
    title: 'ボス戦',
    skills: [
      k('boss-normal', 'ボス戦 Normal', 'ゆっくり戦えるれんしゅう戦', 'battle'),
      k('boss-hard', 'ボス戦 Hard', '本番テストと同じくらいのペース', 'battle'),
      k('boss-god', 'ボス戦 GOD', '本番テストより速い、真の実力者むけ', 'battle'),
      k('boss-hell', 'ボス戦 HELL', 'GOD に勝った子だけ。苦手な問題が続き、時間もポイントもきびしい', 'battle'),
    ],
  },
  {
    module_id: 'trial',
    title: '実力の階段',
    skills: [
      k('trial-kyokugen', '実力の階段・極限', 'やさしい段から登り、どこまで確実にできるかを測る（1回ぶん）', 'trial'),
      k('trial-mugen', '実力の階段・無限', '頂点に届いた子が、単元のすべての項目で まちがえるまで挑み続ける（1回ぶん）', 'trial'),
    ],
  },
];

/** エラーハンター（誤り例を見ぬいて直す）の、どのアプリでも同じ2つ */
const EH_JUDGE_FIX: ModuleEntry = {
  module_id: 'error-hunter',
  title: 'エラーハンター',
  skills: [
    k('eh-judge', '正しい式を「正しい」と見ぬく', 'まちがっていない計算を、まちがい扱いしない', 'choice'),
    k('eh-fix', 'まちがいを見つけて直す', '誤り例のどこが誤りかを見つけ、正しく直す', 'mixed'),
  ],
};

/**
 * アプリごとの、そのアプリにしか無い記号。
 * app_id → 追加モジュール。
 */
export const APP_EXTRA_MODULES: Record<string, ModuleEntry[]> = {
  menseki: [{
    module_id: 'error-hunter',
    title: 'エラーハンター',
    skills: [
      k('eh-judge', '正しい式を「正しい」と見ぬく', 'まちがっていない面積の式を、まちがい扱いしない', 'choice'),
      k('eh-slant', '斜めの辺を高さにしたまちがい', '平行四辺形で底辺 × 斜めの辺をかけてしまう', 'mixed'),
      k('eh-half', '÷2をわすれたまちがい', '三角形の面積を底辺 × 高さのままにする', 'mixed'),
      k('eh-trap', '台形の公式のまちがい', '÷2のわすれ・上底と下底をたさない・上底のわすれ', 'mixed'),
      k('eh-diag', 'ひし形の公式のまちがい', '÷2のわすれ・対角線のかわりに辺を使う', 'mixed'),
      k('eh-height', '三角形で斜めの辺を高さにしたまちがい', '底辺 × 斜めの辺 ÷ 2 としてしまう', 'mixed'),
      k('eh-perim', 'まわりの長さを面積にしたまちがい', '面積を問われて辺の長さの合計を答える', 'mixed'),
      k('eh-unit', '面積の単位のまちがい', '1m² を 100cm² と考える（10000cm² が正しい）', 'mixed'),
    ],
  }],

  taiseki: [{
    module_id: 'error-hunter',
    title: 'エラーハンター',
    skills: [
      k('eh-judge', '正しい式を「正しい」と見ぬく', 'まちがっていない体積の式を、まちがい扱いしない', 'choice'),
      k('eh-add', '3つの長さをたしたまちがい', '縦 ＋ 横 ＋ 高さ を体積にしてしまう', 'mixed'),
      k('eh-area', '高さをかけわすれたまちがい', '縦 × 横（底の面積）で止めてしまう', 'mixed'),
      k('eh-cube', '立方体の公式のまちがい', '1辺 × 3・1辺 × 1辺 にしてしまう', 'mixed'),
      k('eh-unit', '体積の単位のまちがい', '1m³ を 100cm³・10000cm³ と考える（1000000cm³ が正しい）', 'mixed'),
      k('eh-mix', '単位をそろえずにかけたまちがい', 'm と cm がまざった長さをそのままかける', 'mixed'),
      k('eh-outer', '容積を外のりで求めたまちがい', '板の厚さを引かずに外のりで容積を出す', 'mixed'),
      k('eh-double', '組み合わせた立体で重なりを2回数えたまちがい', '分けた直方体に全体の長さをそのまま使う', 'mixed'),
      k('eh-liter', 'かさの単位のまちがい', '1L を 100cm³ と考える（1000cm³ が正しい）', 'mixed'),
    ],
  }],

  bai: [EH_JUDGE_FIX],
  gaisu: [EH_JUDGE_FIX],
  suusei: [EH_JUDGE_FIX],

  karakuri: [{
    module_id: 'error-hunter',
    title: 'エラーハンター',
    skills: [
      k('eh-judge', '正しい式を「正しい」と見ぬく', 'まちがっていない計算を、まちがい扱いしない', 'choice'),
      k('fix-rule', 'きまりのまちがいを直す', '計算のきまりの使い方をまちがえた式を直す', 'mixed'),
    ],
  }],

  hissan: [
    EH_JUDGE_FIX,
    {
      module_id: 'error-hunter',
      title: 'エラーハンター（誤りの型べつ）',
      skills: [
        k('eh-zero', '商の0を書きわすれた式', 'わられる数の途中に0が立つ筆算', 'mixed'),
        k('eh-zerotail', '商のおわりの0を書きわすれた式', '商の末尾に0が立つ筆算', 'mixed'),
        k('eh-rembig', 'あまりがわる数より大きい式', 'あまり ≧ わる数 になっている誤り', 'mixed'),
        k('eh-sub', 'ひき算をまちがえた式', '筆算の途中のひき算の誤り', 'mixed'),
        k('eh-rule10', 'わり算のきまりを使いそこねた式', '両方を10でわったときのあまりの扱い', 'mixed'),
        k('eh-place', '書く位置をまちがえた式', '商を立てる位がずれている誤り', 'mixed'),
      ],
    },
    {
      module_id: 'hissan',
      title: '筆算（けた数べつ）',
      skills: [
        k('hissan-2-1', '2けた ÷ 1けた', '筆算の基本の形', 'hissan'),
        k('hissan-3-1', '3けた ÷ 1けた', '商が2〜3けたになる筆算', 'hissan'),
        k('hissan-2-2', '2けた ÷ 2けた', '仮商の見当をつけて修正する', 'hissan'),
        k('hissan-3-2', '3けた ÷ 2けた', '商の位取り・仮商修正・末尾の0', 'hissan'),
        k('hissan-3-3', '3けた ÷ 3けた', 'わる数が3けたの筆算', 'hissan'),
      ],
    },
    {
      module_id: 'mock-test',
      title: '本番テストモード',
      skills: [k('mock-hissan', '本番テストの筆算（大問ごと）', 'テスト内で解いた筆算1問ぶん', 'hissan')],
    },
  ],

  kakudaizu: [{
    module_id: 'error-hunter',
    title: 'エラーハンター',
    skills: [
      k('eh-pair', '対応しない辺で考えたまちがい', '拡大図・縮図の対応する辺を取りちがえる', 'mixed'),
      k('eh-inverse', '倍を逆にしたまちがい', '拡大と縮小を取りちがえる', 'mixed'),
      k('eh-unit', '単位換算のまちがい', 'cm と m をそろえずに計算する', 'mixed'),
      k('eh-flip', '裏返して考えたまちがい', '向きのちがう図を別の形とみなす', 'mixed'),
      k('eh-additive', '差で考えたまちがい', '倍ではなく「何cm大きい」で考える（加法的推論）', 'mixed'),
      k('eh-angle', '角だけで判断したまちがい', '角が等しければ拡大図だと思いこむ', 'mixed'),
    ],
  }],

  syousu: [
    {
      // 本番テストが2つある（5. 小数のしくみ＝mock-test、13. 小数のかけ算とわり算＝mock-test-muldiv）
      module_id: 'mock-test',
      title: '本番テストモード',
      skills: [
        k('mock-test-muldiv', '本番テスト「小数のかけ算とわり算」（1回ぶん）', '表・裏を通してやったテスト1回ぶんの点数', 'test'),
      ],
    },
    {
      module_id: 'error-hunter',
      title: 'エラーハンター',
      skills: [
        k('judge-correct', '正しい式を「正しい」と見ぬく', 'まちがっていない小数の式を、まちがい扱いしない', 'choice'),
        k('fix-number', '数のまちがいを直す', '小数点や位取りをまちがえた答えを直す', 'number'),
        k('fix-sign', '大小の記号のまちがいを直す', '< と > を取りちがえた式を直す', 'choice'),
      ],
    },
    {
      module_id: 'place-value',
      title: '位の部屋',
      skills: [k('decompose-3', '小数を位ごとに分ける', '3.14 を 1が3こ・0.1が1こ・0.01が4こ に分ける', 'build')],
    },
    {
      module_id: 'addsub',
      title: '小数のたし算・ひき算（やり方ちがい）',
      skills: [
        k('addsub-build-add-basic', 'たし算 ①（筆算を組み立てる）', '位をそろえて筆算の形をつくる', 'build'),
        k('addsub-build-add-diff', 'たし算 ②（筆算を組み立てる）', 'けたのちがう小数の筆算をつくる', 'build'),
        k('addsub-build-sub-basic', 'ひき算 ①（筆算を組み立てる）', '位をそろえて筆算の形をつくる', 'build'),
        k('addsub-build-sub-diff', 'ひき算 ②（筆算を組み立てる）', 'けたのちがう小数の筆算をつくる', 'build'),
        k('addsub-build-sub-whole', 'ひき算 ③（筆算を組み立てる）', '空位のある筆算の形をつくる', 'build'),
        k('addsub-master-add-basic', 'たし算 ①（マスター）', '仕上げのまとめ問題', 'number'),
        k('addsub-master-add-diff', 'たし算 ②（マスター）', '仕上げのまとめ問題', 'number'),
        k('addsub-master-sub-basic', 'ひき算 ①（マスター）', '仕上げのまとめ問題', 'number'),
        k('addsub-master-sub-diff', 'ひき算 ②（マスター）', '仕上げのまとめ問題', 'number'),
        k('addsub-master-sub-whole', 'ひき算 ③（マスター）', '仕上げのまとめ問題', 'number'),
      ],
    },
    {
      module_id: 'number-line',
      title: '数直線（よみとり）',
      skills: [
        k('line-read-line-tenths', '数直線 ①（よみとり）', '0〜1 の目もりが指す小数を読む', 'number'),
        k('line-read-line-0to10', '数直線 ②（よみとり）', '0〜10 の目もりが指す小数を読む', 'number'),
        k('line-read-line-hundredths', '数直線 ③（よみとり）', '0.01きざみの目もりを読む', 'number'),
      ],
    },
    {
      module_id: 'word-problem',
      title: '小数の文章題',
      skills: [
        k('wp-+', '文章題（たし算）', '「あわせて」の場面', 'choice'),
        k('wp--', '文章題（ひき算）', '「のこり」の場面', 'choice'),
        k('wp-×', '文章題（かけ算）', '「1つ分 × いくつ分」の場面', 'choice'),
        k('wp-÷', '文章題（わり算）', '「同じように分ける」の場面', 'choice'),
      ],
    },
  ],
};
