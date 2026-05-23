// tests/systems/movement.test.js
import { describe, it, expect } from 'vitest';
import { applyVelocity } from '../../src/systems/movement.js';

const bounds = { minX: 0, minY: 0, maxX: 800, maxY: 600 };

describe('applyVelocity', () => {
  it('returns unchanged position when velocity is zero', () => {
    expect(applyVelocity(100, 200, 0, 0, 16, bounds)).toEqual({ x: 100, y: 200 });
  });

  it('integrates velocity over delta in ms', () => {
    // 350 px/s * 1000ms = 350 px
    expect(applyVelocity(100, 200, 350, 0, 1000, bounds)).toEqual({ x: 450, y: 200 });
  });

  it('clamps at maxX', () => {
    const r = applyVelocity(790, 300, 350, 0, 1000, bounds);
    expect(r.x).toBe(800);
    expect(r.y).toBe(300);
  });

  it('clamps at minX', () => {
    const r = applyVelocity(10, 300, -350, 0, 1000, bounds);
    expect(r.x).toBe(0);
  });

  it('clamps at maxY', () => {
    const r = applyVelocity(400, 590, 0, 350, 1000, bounds);
    expect(r.y).toBe(600);
  });

  it('clamps at minY', () => {
    const r = applyVelocity(400, 10, 0, -350, 1000, bounds);
    expect(r.y).toBe(0);
  });

  it('clamps each axis independently in diagonal motion', () => {
    // x goes past maxX, y stays in bounds
    const r = applyVelocity(790, 300, 350, 100, 1000, bounds);
    expect(r.x).toBe(800);
    expect(r.y).toBe(400);
  });
});
