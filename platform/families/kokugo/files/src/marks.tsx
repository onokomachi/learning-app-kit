/**
 * 問題ごとのクリアのしるし（4種類）。
 *
 *   ⭐ 一発クリア … 1回目で正解した（この周のクリア・メダルに数える）
 *   💪 ねばりクリア … まちがえたけど、あきらめずに正解した（別に数える。メダルにはしない）
 *   △ ちょうせん中 … まちがえて、まだ正解していない
 *   ・ まだ … 手を付けていない
 *
 * 授業中に先生が机の間を回りながら、画面を見るだけで「どこまで・どう取り組んだか」が
 * 分かるようにするためのもの。ねばりクリアも、別の日に1回で解ければ一発クリアに上がる。
 * PRISM の「クリアマップ」も同じ4種類・同じ色で出す。
 */
export type Mark = 'ippatsu' | 'nebari' | 'trying' | 'none';

export const MARKS: Record<Mark, { icon: string; label: string; dot: string; chip: string }> = {
  ippatsu: { icon: '⭐', label: '一発クリア', dot: 'bg-amber-400', chip: 'bg-amber-100 border-amber-400 text-amber-700' },
  nebari: { icon: '💪', label: 'ねばりクリア', dot: 'bg-sky-400', chip: 'bg-sky-100 border-sky-400 text-sky-700' },
  trying: { icon: '△', label: 'ちょうせん中', dot: 'bg-white ring-2 ring-inset ring-stone-400', chip: 'bg-white border-stone-400 text-stone-500' },
  none: { icon: '', label: 'まだ', dot: 'bg-stone-200', chip: 'bg-stone-50 border-stone-200 text-stone-300' },
};

/** 小さな点の列（タイトル画面のカード用） */
export function MarkDots({ marks }: { marks: readonly Mark[] }) {
  const n = (m: Mark) => marks.filter(x => x === m).length;
  return (
    <div className="flex flex-wrap gap-0.5 mt-2"
      aria-label={`${marks.length}問中 一発クリア${n('ippatsu')}・ねばりクリア${n('nebari')}・ちょうせん中${n('trying')}`}>
      {marks.map((m, k) => <span key={k} className={`w-2.5 h-2.5 rounded-full ${MARKS[m].dot}`} />)}
    </div>
  );
}

/** しるしの見本（タイトル画面の下に小さく） */
export function MarkLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-500">
      {(['ippatsu', 'nebari', 'trying', 'none'] as Mark[]).map(m => (
        <span key={m} className="flex items-center gap-1">
          <span className={`w-2.5 h-2.5 rounded-full ${MARKS[m].dot}`} />{MARKS[m].icon} {MARKS[m].label}
        </span>
      ))}
    </div>
  );
}

/** 問題画面の上の、いまの場面の問題のならび。押すとその問題へ行ける */
export function MarkStrip({ marks, current, onPick }: { marks: readonly Mark[]; current: number; onPick: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1 mb-3" role="list" aria-label="この場面の問題のしるし">
      {marks.map((m, i) => (
        <button key={i} role="listitem" onClick={() => onPick(i)}
          title={`問題${i + 1}：${MARKS[m].label}`}
          className={`w-8 h-8 rounded-lg border-2 text-sm font-bold flex items-center justify-center transition-transform active:scale-90 ${MARKS[m].chip} ${i === current ? 'ring-2 ring-offset-1 ring-orange-400' : ''}`}>
          {MARKS[m].icon || <span className="text-[11px] text-stone-400">{i + 1}</span>}
        </button>
      ))}
    </div>
  );
}
