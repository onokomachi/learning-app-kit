import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joinGateView } from './joinGateView.js';

const base = { trial: false, configured: true, requireJoin: false, named: true, allowWithout: false, open: false, playMode: true, chip: true };

test('JoinGate: playMode を渡さなければ 今までどおり（名乗った子に SOLO/DUO・単元の鍵）', () => {
  assert.deepEqual(joinGateView(base), { kind: 'parts', playMode: true, access: true, chip: true });
  // つないでいないビルドでは SOLO/DUO を出さない（前の PlayModeGate enabled={configured} と同じ）
  assert.deepEqual(joinGateView({ ...base, configured: false }), { kind: 'parts', playMode: false, access: true, chip: true });
});

test('JoinGate: playMode=false は SOLO/DUO だけを出さない。単元の鍵は出す', () => {
  assert.deepEqual(joinGateView({ ...base, playMode: false }), { kind: 'parts', playMode: false, access: true, chip: true });
  assert.deepEqual(joinGateView({ ...base, playMode: false, chip: false }), { kind: 'parts', playMode: false, access: true, chip: false });
});

test('JoinGate: playMode=false でも 名乗り・ログイン必須・体験版・デモの動きは変わらない', () => {
  for (const playMode of [true, false]) {
    // 体験中は名乗りも鍵も出さない
    assert.equal(joinGateView({ ...base, playMode, trial: true, requireJoin: true, named: false }).kind, 'trial');
    // ログイン必須で 名乗っていない → 閉じられない入力画面
    assert.equal(joinGateView({ ...base, playMode, requireJoin: true, named: false }).kind, 'required');
    // デモモード（allowWithout）は ログイン必須でも通す
    assert.equal(joinGateView({ ...base, playMode, requireJoin: true, named: false, allowWithout: true }).kind, 'parts');
    // ログイン必須でも 名乗っていれば ふだん
    assert.equal(joinGateView({ ...base, playMode, requireJoin: true }).kind, 'parts');
    // はじめの1回の入力画面
    assert.equal(joinGateView({ ...base, playMode, named: false, open: true }).kind, 'form');
  }
});
