/**
 * カタログ＝skillId に意味を与える辞書。
 *
 * バックエンドは学習記録を app_id + skill_id という「ただの文字列」で保存する。
 * そうすることでアプリが何個増えてもテーブル構造が変わらずに済むが、
 * 代わりに 'rel-perp' のような記号が何を指すのかを知る場所が必要になる。それがここ。
 *
 * 教師ダッシュボードは lookupSkill() を通して、記号を人が読めるものに戻す。
 */

/** 1つのレベル（＝1つの skillId）。学習記録の最小単位。 */
export interface SkillEntry {
  skill_id: string;
  /** 子どもに見せているレベル名。例: '① 垂直をみつける' */
  label: string;
  /** そのレベルで何ができるようになるか */
  desc: string;
  /** 解答UIの種類（choice / number / gridDraw など）。観点の推定に使う */
  answer_kind: string;
}

/** アプリ内のモジュール（単元内の大きなまとまり）。 */
export interface ModuleEntry {
  module_id: string;
  title: string;
  skills: SkillEntry[];
}

/**
 * 誤概念のタクソノミ。
 * 「正答率」ではなく「どう誤解しているか」を教師に届けるための中核データ。
 */
export interface MisconceptionEntry {
  /** アプリ内での通し番号。例: '誤概念⑪' */
  code: string;
  /** 誤解の中身。例: '長方形の対角線も垂直だと思う' */
  label: string;
  /** この誤概念を扱っている skillId */
  skills: string[];
}

/** 1つの単元アプリぶんのカタログ。 */
export interface AppCatalog {
  app_id: string;
  title: string;
  subject: string;
  grade: number;
  url?: string;
  generated_at: string;
  skill_count: number;
  modules: ModuleEntry[];
  /**
   * レベル表には無いが、アプリが記録を送ってくる記号（本番テスト・ボス戦・
   * エラーハンターなど）。extras.ts で手当てし、index.ts が読み込み時に足す。
   * **skill_count には数えない**——単元の到達度の分母を、遊び方の数で膨らませないため。
   */
  extra_modules?: ModuleEntry[];
  misconceptions: MisconceptionEntry[];
}

/** lookupSkill が返す、記号を解決した結果。 */
export interface ResolvedSkill {
  app_id: string;
  app_title: string;
  subject: string;
  grade: number;
  module_id: string;
  module_title: string;
  skill_id: string;
  label: string;
  desc: string;
  answer_kind: string;
  /** この skillId に結びついている誤概念（無ければ空） */
  misconceptions: MisconceptionEntry[];
  /** レベル表の項目ではなく、本番テストやボス戦のような遊び方のほうか */
  is_extra: boolean;
}
