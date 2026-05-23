// src/systems/movement.js
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function applyVelocity(x, y, vx, vy, deltaMs, bounds) {
  const dt = deltaMs / 1000;
  return {
    x: clamp(x + vx * dt, bounds.minX, bounds.maxX),
    y: clamp(y + vy * dt, bounds.minY, bounds.maxY),
  };
}
