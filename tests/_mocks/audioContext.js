// tests/_mocks/audioContext.js
// Minimal AudioContext mock for unit tests. Records calls so tests can assert behavior.

export function createMockAudioContext() {
  const calls = [];
  const make = (kind, props = {}) => {
    const node = {
      _kind: kind,
      connect: (dest) => { calls.push([kind, 'connect', dest && dest._kind]); return dest; },
      disconnect: () => { calls.push([kind, 'disconnect']); },
      ...props,
    };
    return node;
  };
  const makeParam = (name) => {
    const param = { value: 0 };
    param.setValueAtTime = (v, t) => { calls.push([name, 'setValueAtTime', v, t]); param.value = v; };
    param.exponentialRampToValueAtTime = (v, t) => { calls.push([name, 'expRamp', v, t]); };
    param.linearRampToValueAtTime = (v, t) => { calls.push([name, 'linRamp', v, t]); };
    param.cancelScheduledValues = (t) => { calls.push([name, 'cancel', t]); };
    return param;
  };
  const ctx = {
    currentTime: 0,
    destination: { _kind: 'destination' },
    state: 'running',
    resume: () => { calls.push(['ctx', 'resume']); ctx.state = 'running'; return Promise.resolve(); },
    close: () => { calls.push(['ctx', 'close']); ctx.state = 'closed'; return Promise.resolve(); },
    createOscillator: () => {
      const osc = make('osc', {
        type: 'sine',
        frequency: makeParam('osc.frequency'),
        start: (t) => calls.push(['osc', 'start', t]),
        stop: (t) => calls.push(['osc', 'stop', t]),
      });
      return osc;
    },
    createGain: () => make('gain', { gain: makeParam('gain.gain') }),
    _calls: calls,
  };
  return ctx;
}
