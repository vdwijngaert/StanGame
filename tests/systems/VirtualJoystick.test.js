// tests/systems/VirtualJoystick.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualJoystick } from '../../src/systems/VirtualJoystick.js';

const cfg = { baseRadius: 60, thumbMaxRadius: 50, deadzone: 0.15 };

describe('VirtualJoystick', () => {
  let j;
  beforeEach(() => {
    j = new VirtualJoystick(cfg);
  });

  it('starts inactive with zero vector', () => {
    expect(j.active).toBe(false);
    expect(j.vector).toEqual({ x: 0, y: 0, magnitude: 0 });
  });

  it('activates on pointer down and anchors base + thumb', () => {
    j.onPointerDown(1, 100, 200);
    expect(j.active).toBe(true);
    expect(j.baseX).toBe(100);
    expect(j.baseY).toBe(200);
    expect(j.thumbX).toBe(100);
    expect(j.thumbY).toBe(200);
    expect(j.vector).toEqual({ x: 0, y: 0, magnitude: 0 });
  });

  it('updates thumb on pointer move within the ring', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerMove(1, 130, 100); // 30px right, inside thumbMaxRadius=50
    expect(j.thumbX).toBe(130);
    expect(j.thumbY).toBe(100);
    const v = j.vector;
    expect(v.x).toBeCloseTo(0.6, 5);  // 30/50
    expect(v.y).toBeCloseTo(0, 5);
    expect(v.magnitude).toBeCloseTo(0.6, 5);
  });

  it('clamps thumb to the ring at thumbMaxRadius', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerMove(1, 300, 100); // 200px right, far beyond thumbMaxRadius=50
    expect(j.thumbX).toBe(150); // clamped to baseX + thumbMaxRadius
    expect(j.thumbY).toBe(100);
    const v = j.vector;
    expect(v.x).toBeCloseTo(1, 5);
    expect(v.magnitude).toBeCloseTo(1, 5);
  });

  it('clamps diagonal thumb to the ring with normalized direction', () => {
    j.onPointerDown(1, 0, 0);
    j.onPointerMove(1, 100, 100); // direction (1,1), distance 141, clamped to 50
    const expected = 50 / Math.sqrt(2);
    expect(j.thumbX).toBeCloseTo(expected, 5);
    expect(j.thumbY).toBeCloseTo(expected, 5);
    const v = j.vector;
    expect(v.magnitude).toBeCloseTo(1, 5);
    expect(v.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(v.y).toBeCloseTo(Math.SQRT1_2, 5);
  });

  it('returns zero vector inside the deadzone', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerMove(1, 103, 100); // 3px / 50 = 0.06 < 0.15 deadzone
    expect(j.vector).toEqual({ x: 0, y: 0, magnitude: 0 });
  });

  it('deactivates and zeroes vector on pointer up', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerMove(1, 140, 100);
    j.onPointerUp(1);
    expect(j.active).toBe(false);
    expect(j.vector).toEqual({ x: 0, y: 0, magnitude: 0 });
  });

  it('ignores a second pointer down while active', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerDown(2, 300, 300);
    expect(j.baseX).toBe(100);
    expect(j.baseY).toBe(100);
    expect(j.pointerId).toBe(1);
  });

  it('ignores pointer move from a non-matching pointer id', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerMove(2, 140, 100);
    expect(j.thumbX).toBe(100);
    expect(j.thumbY).toBe(100);
  });

  it('ignores pointer up from a non-matching pointer id', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerUp(2);
    expect(j.active).toBe(true);
  });
});
