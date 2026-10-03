/**
 * やさしい効果音（Web Audio API でその場合成。音声ファイル不要）。
 * 不快なブザー音は使わない。正解・クリア・レベルアップの前向きな音のみ。
 *
 * 音のオン・オフはアプリの設定にあるので、読み方（isEnabled）を受け取る:
 *   export const { playCorrect, playClear, playLevelUp, playSoftTry } =
 *     createSound(() => useSettingsStore.getState().soundEnabled);
 */
let ctx = null;
function audio() {
    if (typeof window === 'undefined')
        return null;
    try {
        if (!ctx)
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx;
    }
    catch {
        return null;
    }
}
function tone(freq, start, dur, gain = 0.15, type = 'sine') {
    const ac = audio();
    if (!ac)
        return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = ac.currentTime + start;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
}
export function createSound(isEnabled) {
    return {
        playCorrect: () => { if (isEnabled())
            tone(880, 0, 0.12, 0.12); },
        playClear: () => { if (isEnabled())
            [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.1, 0.18, 0.14)); },
        playLevelUp: () => { if (isEnabled())
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.2, 0.16, 'triangle')); },
        playSoftTry: () => { if (isEnabled())
            tone(330, 0, 0.16, 0.08, 'sine'); },
    };
}
//# sourceMappingURL=sound.js.map