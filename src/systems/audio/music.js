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
