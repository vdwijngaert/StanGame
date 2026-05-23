// tests/systems/ScoreManager.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '../../src/systems/ScoreManager.js';

const cfg = { distancePerPoint: 5, ballBonus: 10, goalBonus: 100, goalInterval: 500 };

describe('ScoreManager', () => {
  let sm;
  beforeEach(() => {
    // Isolate localStorage between tests
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v); },
    });
    sm = new ScoreManager(cfg);
  });

  it('starts at zero', () => {
    expect(sm.score).toBe(0);
  });

  it('adds distance points', () => {
    sm.addDistance(15); // 15px / 5 = 3 points
    expect(sm.score).toBe(3);
  });

  it('adds ball bonus', () => {
    sm.collectBall();
    expect(sm.score).toBe(10);
  });

  it('detects goal milestone and adds bonus', () => {
    sm.addDistance(2500); // 500 points
    expect(sm.checkGoal()).toBe(true);
    expect(sm.score).toBe(600); // 500 + 100
  });

  it('does not trigger same goal milestone twice', () => {
    sm.addDistance(2500);
    sm.checkGoal();
    expect(sm.checkGoal()).toBe(false);
  });

  it('saves and reads high score from localStorage', () => {
    sm.addDistance(500);
    sm.saveHighScore();
    const sm2 = new ScoreManager(cfg);
    expect(sm2.highScore).toBe(100);
  });
});
