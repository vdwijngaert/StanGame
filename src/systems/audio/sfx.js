// src/systems/audio/sfx.js
// Pure procedural SFX patches. Each function takes an AudioContext and a destination node.

function blip(ctx, dest, freq, startOffset, duration, type = 'square', peak = 0.4) {
  const t0 = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const SFX = {
  ball(ctx, dest) {
    blip(ctx, dest, 523.25, 0,    0.05, 'square'); // C5
    blip(ctx, dest, 659.25, 0.05, 0.06, 'square'); // E5
  },
};
