import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseNum, buildLayout, applyBorrows, toggleBorrow, canBorrow, typeDigit, carryOf,
  rowValues, commonZeros, type ColumnLayout, type DivisionLayout,
} from './scratchLayout.js';

const digits = (cells: ({ digit: string } | null)[]) => cells.map((c) => c?.digit ?? '_').join('');
const col = (op: '+' | '-' | '×', a: string, b: string) => {
  const r = buildLayout({ op, a, b });
  assert.ok(r.ok); return r.layout as ColumnLayout;
};

test('parseNum: 小数・先頭の0・読めない形', () => {
  assert.deepEqual(parseNum('0.25'), { int: '0', dec: '25' });
  assert.deepEqual(parseNum('007'), { int: '7', dec: '' });
  assert.equal(parseNum('.5'), null);
  assert.equal(parseNum('1.'), null);
  assert.equal(parseNum(''), null);
});

test('たし算: 位をそろえ、左に くり上がり用の1列をとる', () => {
  const l = col('+', '478', '56');
  assert.equal(l.width, 4);
  assert.equal(digits(l.top.cells), '_478');
  assert.equal(digits(l.bottom.cells), '__56');
  assert.equal(l.answer.max, 2, 'たし算の答えは 2けた入れて くり上がりを出せる');
});

test('たし算・ひき算: 小数点で そろえる', () => {
  const l = col('+', '12.5', '3.75');
  assert.equal(digits(l.top.cells), '_125_');
  assert.equal(digits(l.bottom.cells), '__375');
  assert.equal(l.answer.fixedPointAfter, 2);
});

test('ひき算: 上の数の 足りない小数のけたは うすい0で うめる（そこへ かりられるように）', () => {
  const l = col('-', '5', '1.23');
  assert.equal(digits(l.top.cells), '500');
  assert.equal(l.top.cells[1]?.helper, true);
  assert.equal(l.top.pointAfter, 0);
  assert.equal(l.borrowTop, true);
  assert.equal(l.answer.max, 1);
});

test('ひき算: 上が小さいときは 組み立てない', () => {
  const r = buildLayout({ op: '-', a: '12', b: '30' });
  assert.equal(r.ok, false);
});

test('かけ算: 2けた以上なら 部分積の段と 合計の段', () => {
  const l = col('×', '347', '26');
  assert.equal(l.width, 5);
  assert.equal(l.partials.length, 2);
  assert.deepEqual([l.partials[0]!.start, l.partials[0]!.end], [1, 4]);
  assert.deepEqual([l.partials[1]!.start, l.partials[1]!.end], [0, 3]);
  assert.deepEqual([l.answer.start, l.answer.end], [0, 4]);
  assert.equal(l.answer.freePoint, true);
});

test('かけ算: 1けたなら 答えの段だけ。小数は右で そろえる', () => {
  const l = col('×', '2.4', '3');
  assert.equal(l.partials.length, 0);
  assert.equal(digits(l.top.cells), '_24', '答えのけた数（2+1）ぶん幅をとる');
  assert.equal(l.top.pointAfter, 1);
});

test('かけ算: 0.25 の先頭の0は かけない', () => {
  const l = col('×', '48', '0.25');
  assert.equal(l.partials.length, 2);
});

test('わり算: かぎ形と、かける・ひくの組。0をつけたすと わり進める', () => {
  const r = buildLayout({ op: '÷', a: '756', b: '28' });
  assert.ok(r.ok);
  const l = r.layout as DivisionLayout;
  assert.equal(l.width, 3);
  assert.equal(l.divisor, '28');
  assert.equal(l.steps.length, 3);
  assert.equal(l.steps[0]!.product.lineBelow, true);
  assert.equal(l.steps[0]!.diff.borrowable, true);
  const r2 = buildLayout({ op: '÷', a: '7', b: '4', extraZeros: 2 });
  assert.ok(r2.ok);
  const l2 = r2.layout as DivisionLayout;
  assert.equal(digits(l2.dividend.cells), '700');
  assert.equal(l2.dividend.pointAfter, 0, '整数に0をつけたすと 小数点がつく');
  assert.equal(buildLayout({ op: '÷', a: '7', b: '0' }).ok, false);
});

test('10 かりる: 52 の 2 → 5 が 4、2 が 12', () => {
  const v = applyBorrows([5, 2], [1]);
  assert.deepEqual(v.values, [4, 12]);
  assert.deepEqual(v.changed, [true, true]);
});

test('10 かりる: 0 が続くと つながる（300 の一の位 → 2, 9, 10）', () => {
  const v = applyBorrows([3, 0, 0], [2]);
  assert.deepEqual(v.values, [2, 9, 10]);
});

test('10 かりる: 左に数字が無ければ 何もしない', () => {
  assert.equal(canBorrow([null, 4], [], 1), false);
  assert.equal(canBorrow([0, 4], [], 1), false);
  assert.deepEqual(toggleBorrow([null, 4], [], 1), []);
});

test('10 かりる: もう一度おすと もどる（あとの操作も いっしょに）', () => {
  const base = [4, 0, 3];
  let ops = toggleBorrow(base, [], 2);          // 4,0,3 → 3,9,13
  assert.deepEqual(applyBorrows(base, ops).values, [3, 9, 13]);
  ops = toggleBorrow(base, ops, 1);             // 十の位でも かりる → 2,19,13
  assert.deepEqual(applyBorrows(base, ops).values, [2, 19, 13]);
  ops = toggleBorrow(base, ops, 2);             // 一の位を おしなおすと 両方もどる
  assert.deepEqual(ops, []);
});

test('マスへの入力: 2けた目で くり上がり、いっぱいなら 打ち直し', () => {
  let b = typeDigit('', '1', 2); b = typeDigit(b, '3', 2);
  assert.equal(b, '13'); assert.equal(carryOf(b), '1');
  assert.equal(typeDigit(b, '7', 2), '7');
  assert.equal(typeDigit('4', '5', 1), '5');
  assert.deepEqual(rowValues(['', '13', '4']), [null, 3, 4]);
});

test('0を消す くふう: いっしょに消せる0の数', () => {
  assert.equal(commonZeros('4800', '600'), 2);
  assert.equal(commonZeros('4800', '64'), 0);
  assert.equal(commonZeros('0', '10'), 0);
  assert.equal(commonZeros('12.0', '10'), 0);
});
