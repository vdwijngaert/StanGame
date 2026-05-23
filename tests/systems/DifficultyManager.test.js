// tests/systems/DifficultyManager.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { DifficultyManager } from '../../src/systems/DifficultyManager.js';

const cfg = {
  levelUpInterval: 30000,
  initialSpeed: 200,
  speedIncrement: 30,
  initialSpawnInterval: 2200,
  spawnIntervalDecrement: 150,
  minSpawnInterval: 600,
};

describe('DifficultyManager', () => {
  let dm;
  beforeEach(() => { dm = new DifficultyManager(cfg); });

  it('starts at level 1 with initial speed', () => {
    expect(dm.level).toBe(1);
    expect(dm.scrollSpeed).toBe(200);
    expect(dm.spawnInterval).toBe(2200);
  });

  it('advances level after levelUpInterval ms', () => {
    dm.update(30000);
    expect(dm.level).toBe(2);
    expect(dm.scrollSpeed).toBe(230);
    expect(dm.spawnInterval).toBe(2050);
  });

  it('does not go below minSpawnInterval', () => {
    for (let i = 0; i < 20; i++) dm.update(30000);
    expect(dm.spawnInterval).toBeGreaterThanOrEqual(600);
  });

  it('partial time does not advance level', () => {
    dm.update(15000);
    expect(dm.level).toBe(1);
  });

  it('multi-level jump advances correctly', () => {
    dm.update(90000);
    expect(dm.level).toBe(4);
    expect(dm.scrollSpeed).toBe(290);
    expect(dm.spawnInterval).toBe(1750);
  });

  it('justLeveledUp is false initially', () => {
    expect(dm.justLeveledUp).toBe(false);
  });

  it('justLeveledUp is true immediately after level-up', () => {
    dm.update(30000);
    expect(dm.justLeveledUp).toBe(true);
  });

  it('justLeveledUp resets to false on next update', () => {
    dm.update(30000);
    dm.update(100);
    expect(dm.justLeveledUp).toBe(false);
  });

  it('justLeveledUp is false when no level-up occurs', () => {
    dm.update(1000);
    expect(dm.justLeveledUp).toBe(false);
  });
});
