// src/systems/audio/music.js
// 8-bar chiptune loop in C major. Pure data — no audio APIs here.

export const BEATS_PER_BAR = 4;
export const BARS_PER_LOOP = 8;

// Hertz for notes used in the loop.
const N = {
  C2: 65.41, G2: 98.00,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00, B5: 987.77,
};

// Bass: root, fifth, root, fifth across the 8 bars. Triangle wave.
export const BASS_PATTERN = [];
const bassBars = [N.C2, N.G2, N.C2, N.G2, N.C2, N.G2, N.C2, N.G2];
for (let bar = 0; bar < BARS_PER_LOOP; bar++) {
  BASS_PATTERN.push({ bar, beat: 0, freq: bassBars[bar], duration: 0.45, wave: 'triangle' });
  BASS_PATTERN.push({ bar, beat: 2, freq: bassBars[bar], duration: 0.45, wave: 'triangle' });
}

// Arpeggio: 8 eighth-notes per bar. Square wave.
const arpBar = [N.C5, N.E5, N.G5, N.C5, N.E5, N.G5, N.B5, N.A5];
export const ARP_PATTERN = [];
for (let bar = 0; bar < BARS_PER_LOOP; bar++) {
  for (let step = 0; step < 8; step++) {
    ARP_PATTERN.push({
      bar,
      beat: step * 0.5,
      freq: arpBar[step],
      duration: 0.18,
      wave: 'square',
    });
  }
}

// Sequencer: schedules notes ahead of AudioContext.currentTime using a sorted cursor.
// The full pattern is pre-flattened into one list sorted by absolute beat. A `nextNoteIndex`
// cursor advances through the list; when it wraps, `loopStart` advances by one loop length.
// A 25 ms setInterval keeps the schedule window topped up.

const TICK_MS = 25;

export function createSequencer(ctx, dest, opts = {}) {
  const bpm = opts.bpm ?? 120;
  const lookAhead = opts.scheduleAheadSeconds ?? 0.1;
  const secondsPerBeat = 60 / bpm;
  const loopSeconds = secondsPerBeat * BEATS_PER_BAR * BARS_PER_LOOP;

  const allNotes = [...BASS_PATTERN, ...ARP_PATTERN]
    .map(n => ({ ...n, absBeat: n.bar * BEATS_PER_BAR + n.beat }))
    .sort((a, b) => a.absBeat - b.absBeat);

  let running = false;
  let loopStart = 0;
  let nextNoteIndex = 0;
  let tickHandle = null;

  function emit(note, absTime) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = note.wave;
    osc.frequency.setValueAtTime(note.freq, absTime);
    gain.gain.setValueAtTime(0.0001, absTime);
    gain.gain.exponentialRampToValueAtTime(0.25, absTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, absTime + note.duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(absTime);
    osc.stop(absTime + note.duration + 0.02);
  }

  function tick() {
    if (!running) return;
    const horizon = ctx.currentTime + lookAhead;
    // Safety bound: never schedule more than the full loop's notes in one tick.
    let safety = allNotes.length + 1;
    while (safety-- > 0) {
      const note = allNotes[nextNoteIndex];
      const absTime = loopStart + note.absBeat * secondsPerBeat;
      if (absTime >= horizon) break;
      emit(note, absTime);
      nextNoteIndex++;
      if (nextNoteIndex >= allNotes.length) {
        nextNoteIndex = 0;
        loopStart += loopSeconds;
      }
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      loopStart = ctx.currentTime;
      nextNoteIndex = 0;
      tick();
      if (typeof setInterval === 'function') {
        tickHandle = setInterval(tick, TICK_MS);
      }
    },
    stop() {
      running = false;
      if (tickHandle !== null && typeof clearInterval === 'function') {
        clearInterval(tickHandle);
        tickHandle = null;
      }
    },
    isRunning() { return running; },
    _tick: tick,
  };
}
