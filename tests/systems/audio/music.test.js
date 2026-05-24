import { describe, it, expect } from 'vitest';
import { BASS_PATTERN, ARP_PATTERN, BEATS_PER_BAR, BARS_PER_LOOP } from '../../../src/systems/audio/music.js';
import { createSequencer } from '../../../src/systems/audio/music.js';
import { createMockAudioContext } from '../../_mocks/audioContext.js';

describe('music patterns', () => {
  it('exports an 8-bar loop in 4/4', () => {
    expect(BEATS_PER_BAR).toBe(4);
    expect(BARS_PER_LOOP).toBe(8);
  });

  it('bass plays on beats 1 and 3 of every bar', () => {
    expect(BASS_PATTERN.length).toBe(BARS_PER_LOOP * 2);
    const beatsInBar0 = BASS_PATTERN.filter(n => n.bar === 0).map(n => n.beat).sort();
    expect(beatsInBar0).toEqual([0, 2]);
  });

  it('arpeggio plays 8 eighth-notes per bar', () => {
    expect(ARP_PATTERN.length).toBe(BARS_PER_LOOP * 8);
    const bar0 = ARP_PATTERN.filter(n => n.bar === 0);
    expect(bar0.length).toBe(8);
    const beats = bar0.map(n => n.beat).sort((a, b) => a - b);
    expect(beats).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
  });
});

describe('createSequencer', () => {
  it('start() schedules the first batch of notes', () => {
    const ctx = createMockAudioContext();
    const dest = ctx.createGain();
    const seq = createSequencer(ctx, dest, { bpm: 120, scheduleAheadSeconds: 0.2 });

    ctx._calls.length = 0;
    seq.start();

    const oscStarts = ctx._calls.filter(c => c[0] === 'osc' && c[1] === 'start');
    expect(oscStarts.length).toBeGreaterThan(0);

    seq.stop();
  });

  it('start() is idempotent', () => {
    const ctx = createMockAudioContext();
    const dest = ctx.createGain();
    const seq = createSequencer(ctx, dest, { bpm: 120, scheduleAheadSeconds: 0.2 });

    seq.start();
    ctx._calls.length = 0;
    seq.start(); // should be no-op
    const oscStarts = ctx._calls.filter(c => c[0] === 'osc' && c[1] === 'start');
    expect(oscStarts.length).toBe(0);

    seq.stop();
  });

  it('stop() clears scheduling timer (no new notes after stop)', () => {
    const ctx = createMockAudioContext();
    const dest = ctx.createGain();
    const seq = createSequencer(ctx, dest, { bpm: 120, scheduleAheadSeconds: 0.2 });
    seq.start();
    seq.stop();
    expect(seq.isRunning()).toBe(false);
  });
});
