import { describe, it, expect } from 'vitest';
import { createMockAudioContext } from '../../_mocks/audioContext.js';
import { SFX } from '../../../src/systems/audio/sfx.js';

describe('SFX.ball', () => {
  it('creates two oscillators (C5 then E5) connected through a gain node', () => {
    const ctx = createMockAudioContext();
    const dest = ctx.createGain();
    ctx._calls.length = 0;

    SFX.ball(ctx, dest);

    const oscStarts = ctx._calls.filter(c => c[0] === 'osc' && c[1] === 'start');
    expect(oscStarts.length).toBe(2);
    const freqSets = ctx._calls.filter(c => c[0] === 'osc.frequency' && c[1] === 'setValueAtTime');
    const freqs = freqSets.map(c => Math.round(c[2]));
    expect(freqs).toContain(523); // C5
    expect(freqs).toContain(659); // E5
  });
});
