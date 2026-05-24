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

  hit(ctx, dest) {
    // Low triangle that sweeps down — feels like a thud.
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t0);
    osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.25);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.6, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t0);
    osc.stop(t0 + 0.27);
  },

  levelUp(ctx, dest) {
    // C5–E5–G5 arpeggio.
    blip(ctx, dest, 523.25, 0.00, 0.07, 'square');
    blip(ctx, dest, 659.25, 0.07, 0.07, 'square');
    blip(ctx, dest, 783.99, 0.14, 0.10, 'square');
  },

  shieldOn(ctx, dest) {
    // Sweep + perfect-fifth shimmer.
    const t0 = ctx.currentTime;
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(600, t0);
    sweep.frequency.exponentialRampToValueAtTime(1200, t0 + 0.3);
    sweepGain.gain.setValueAtTime(0.0001, t0);
    sweepGain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.05);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
    sweep.connect(sweepGain);
    sweepGain.connect(dest);
    sweep.start(t0);
    sweep.stop(t0 + 0.32);
    blip(ctx, dest, 988, 0.05, 0.2, 'sine', 0.25); // B5 shimmer top
  },

  shieldOff(ctx, dest) {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t0);
    osc.frequency.exponentialRampToValueAtTime(400, t0 + 0.12);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t0);
    osc.stop(t0 + 0.14);
  },

  gameOver(ctx, dest) {
    // G4–F4–D4–C4 descending sting.
    blip(ctx, dest, 392.00, 0.00, 0.15, 'square');
    blip(ctx, dest, 349.23, 0.15, 0.15, 'square');
    blip(ctx, dest, 293.66, 0.30, 0.15, 'square');
    blip(ctx, dest, 261.63, 0.45, 0.25, 'square');
  },
};
