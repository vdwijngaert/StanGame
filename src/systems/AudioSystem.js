// src/systems/AudioSystem.js
// Owns one AudioContext, master gain, mute state, music sequencer.
// Pure JS, no Phaser dependency — testable in Node via injected contextFactory.

import { SFX } from './audio/sfx.js';
import { createSequencer } from './audio/music.js';

export class AudioSystem {
  constructor({ config, contextFactory, storage } = {}) {
    this._config = config;
    this._contextFactory = contextFactory ?? (() => new (window.AudioContext || window.webkitAudioContext)());
    this._storage = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    this._ctx = null;
    this._masterGain = null;
    this._musicGain = null;
    this._sfxGain = null;
    this._sequencer = null;
    this._muted = this._loadMuted();
  }

  _loadMuted() {
    if (!this._storage) return false;
    const raw = this._storage.getItem(this._config.muteStorageKey);
    return raw === 'true';
  }

  _persistMuted() {
    if (!this._storage) return;
    this._storage.setItem(this._config.muteStorageKey, String(this._muted));
  }

  unlock() {
    if (this._ctx) {
      if (this._ctx.state === 'suspended' && typeof this._ctx.resume === 'function') {
        this._ctx.resume();
      }
      return;
    }
    const ctx = this._contextFactory();
    this._ctx = ctx;

    this._masterGain = ctx.createGain();
    this._masterGain.gain.setValueAtTime(this._muted ? 0 : this._config.masterVolume, ctx.currentTime);
    this._masterGain.connect(ctx.destination);

    this._sfxGain = ctx.createGain();
    this._sfxGain.gain.setValueAtTime(1, ctx.currentTime);
    this._sfxGain.connect(this._masterGain);

    this._musicGain = ctx.createGain();
    this._musicGain.gain.setValueAtTime(this._config.musicVolume, ctx.currentTime);
    this._musicGain.connect(this._masterGain);

    if (typeof ctx.resume === 'function' && ctx.state === 'suspended') ctx.resume();
  }

  isMuted() { return this._muted; }

  toggleMute() {
    this._muted = !this._muted;
    this._persistMuted();
    if (this._ctx && this._masterGain) {
      const now = this._ctx.currentTime;
      const target = this._muted ? 0 : this._config.masterVolume;
      this._masterGain.gain.cancelScheduledValues(now);
      this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, now);
      this._masterGain.gain.linearRampToValueAtTime(target, now + 0.01);
    }
    return this._muted;
  }

  play(name) {
    if (this._muted) return;
    if (!this._ctx) return;
    const fn = SFX[name];
    if (!fn) return;
    fn(this._ctx, this._sfxGain);
  }

  startMusic() {
    if (!this._ctx) return;
    if (this._sequencer && this._sequencer.isRunning()) return;
    this._sequencer = createSequencer(this._ctx, this._musicGain, { bpm: this._config.musicBpm });
    this._sequencer.start();
  }

  stopMusic() {
    if (this._sequencer) {
      this._sequencer.stop();
      this._sequencer = null;
    }
  }
}
