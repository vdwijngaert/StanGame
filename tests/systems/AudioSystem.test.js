import { describe, it, expect, beforeEach } from 'vitest';
import { AudioSystem } from '../../src/systems/AudioSystem.js';
import { createMockAudioContext } from '../_mocks/audioContext.js';
import { CONFIG } from '../../src/config.js';

function fakeStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    _store: store,
  };
}

describe('AudioSystem', () => {
  let ctx, storage, audio;

  beforeEach(() => {
    ctx = createMockAudioContext();
    storage = fakeStorage();
    audio = new AudioSystem({
      config: CONFIG.audio,
      contextFactory: () => ctx,
      storage,
    });
  });

  it('does not create a context until unlock()', () => {
    expect(audio._ctx).toBeNull();
  });

  it('unlock() creates the context once', () => {
    audio.unlock();
    expect(audio._ctx).toBe(ctx);
    const before = audio._ctx;
    audio.unlock();
    expect(audio._ctx).toBe(before);
  });

  it('defaults to unmuted when storage key is absent', () => {
    expect(audio.isMuted()).toBe(false);
  });

  it('loads muted=true from storage', () => {
    storage.setItem(CONFIG.audio.muteStorageKey, 'true');
    const a = new AudioSystem({ config: CONFIG.audio, contextFactory: () => ctx, storage });
    expect(a.isMuted()).toBe(true);
  });

  it('toggleMute() flips the flag and persists', () => {
    audio.unlock();
    expect(audio.toggleMute()).toBe(true);
    expect(storage.getItem(CONFIG.audio.muteStorageKey)).toBe('true');
    expect(audio.toggleMute()).toBe(false);
    expect(storage.getItem(CONFIG.audio.muteStorageKey)).toBe('false');
  });

  it('play(name) is a no-op when muted', () => {
    audio.unlock();
    audio.toggleMute(); // now muted
    ctx._calls.length = 0;
    audio.play('ball');
    const starts = ctx._calls.filter(c => c[0] === 'osc' && c[1] === 'start');
    expect(starts.length).toBe(0);
  });

  it('play(name) triggers SFX when unmuted', () => {
    audio.unlock();
    ctx._calls.length = 0;
    audio.play('ball');
    const starts = ctx._calls.filter(c => c[0] === 'osc' && c[1] === 'start');
    expect(starts.length).toBeGreaterThan(0);
  });

  it('startMusic() is idempotent', () => {
    audio.unlock();
    audio.startMusic();
    ctx._calls.length = 0;
    audio.startMusic();
    const starts = ctx._calls.filter(c => c[0] === 'osc' && c[1] === 'start');
    expect(starts.length).toBe(0);
    audio.stopMusic();
  });

  it('play(name) returns silently for an unknown SFX', () => {
    audio.unlock();
    expect(() => audio.play('nonexistent')).not.toThrow();
  });
});
