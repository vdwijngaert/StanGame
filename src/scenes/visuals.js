// src/scenes/visuals.js
// Visual helpers shared across scenes. Pure Phaser; not unit-tested.

/**
 * Draw a rounded panel with a vertical gradient fill and a thin border.
 * Clears the graphics object first.
 */
export function drawRoundedGradientPanel(g, x, y, w, h, opts = {}) {
  const {
    radius = 14,
    topColor = 0x1a2640,
    bottomColor = 0x05080f,
    borderColor = 0xffffff,
    borderAlpha = 0.25,
    borderWidth = 1,
  } = opts;

  g.clear();
  // Phaser's fillGradientStyle works on rects/triangles but not roundedRect directly.
  // Approximate by stacking thin horizontal strips of interpolated color.
  const strips = Math.max(8, Math.round(h / 2));
  for (let i = 0; i < strips; i++) {
    const t = i / (strips - 1);
    const color = lerpColor(topColor, bottomColor, t);
    const stripY = y + (h * i) / strips;
    const stripH = h / strips + 1; // +1 to avoid 1px gaps from rounding
    // Clip first and last strips inside the rounded rect via radius.
    const inset = inset_for_strip(i, strips, radius);
    g.fillStyle(color, 1);
    g.fillRect(x + inset, stripY, w - inset * 2, stripH);
  }
  // Border on top.
  g.lineStyle(borderWidth, borderColor, borderAlpha);
  g.strokeRoundedRect(x, y, w, h, radius);
}

function inset_for_strip(i, total, radius) {
  // Pull edges in near top/bottom strips to fake the rounded corners.
  const fromTop = i;
  const fromBot = total - 1 - i;
  const edgeDist = Math.min(fromTop, fromBot);
  const cornerStrips = Math.min(radius, total / 2);
  if (edgeDist >= cornerStrips) return 0;
  // Quarter-circle approximation.
  const dy = cornerStrips - edgeDist;
  const dx = radius - Math.sqrt(Math.max(0, radius * radius - dy * dy));
  return dx;
}

function lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

/**
 * Spawn a small radial burst of circles tweening outward and fading.
 * Used for ball-collect (gold) and shield-grab (cyan) feedback.
 */
export function spawnBurst(scene, x, y, opts = {}) {
  const {
    count = 10,
    color = 0xffd700,
    radius = 3,
    distance = 50,
    duration = 600,
    depth = 20,
  } = opts;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const dx = Math.cos(angle) * distance * (0.6 + Math.random() * 0.5);
    const dy = Math.sin(angle) * distance * (0.6 + Math.random() * 0.5);

    const p = scene.add.graphics().setDepth(depth);
    p.fillStyle(color, 1);
    p.fillCircle(0, 0, radius);
    p.setPosition(x, y);

    scene.tweens.add({
      targets: p,
      x: x + dx,
      y: y + dy,
      alpha: 0,
      duration: duration + Math.random() * 150,
      ease: 'Cubic.easeOut',
      onComplete: () => p.destroy(),
    });
  }
}

/**
 * Expanding ring (used for shield grab).
 */
export function spawnRing(scene, x, y, opts = {}) {
  const {
    color = 0x60a5fa,
    startRadius = 12,
    endRadius = 80,
    lineWidth = 4,
    duration = 500,
    depth = 20,
  } = opts;

  const ring = scene.add.graphics().setDepth(depth);
  const state = { r: startRadius, alpha: 1 };
  const redraw = () => {
    ring.clear();
    ring.lineStyle(lineWidth, color, state.alpha);
    ring.strokeCircle(0, 0, state.r);
  };
  ring.setPosition(x, y);
  redraw();

  scene.tweens.add({
    targets: state,
    r: endRadius,
    alpha: 0,
    duration,
    ease: 'Cubic.easeOut',
    onUpdate: redraw,
    onComplete: () => ring.destroy(),
  });
}
