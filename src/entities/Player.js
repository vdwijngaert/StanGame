// src/entities/Player.js
import { applyVelocity } from '../systems/movement.js';

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function lighten(c, amt) {
  const r = (c >> 16) & 0xff, g = (c >> 8) & 0xff, b = c & 0xff;
  const t = clamp01(amt);
  return ((Math.round(r + (255 - r) * t) << 16) | (Math.round(g + (255 - g) * t) << 8) | Math.round(b + (255 - b) * t));
}
function darken(c, amt) {
  const r = (c >> 16) & 0xff, g = (c >> 8) & 0xff, b = c & 0xff;
  const t = clamp01(amt);
  return ((Math.round(r * (1 - t)) << 16) | (Math.round(g * (1 - t)) << 8) | Math.round(b * (1 - t)));
}

export class Player {
  constructor(scene, x, y, cfg) {
    this._scene = scene;
    this._cfg = cfg;
    this._invincible = false;
    this._flickerTimer = null;
    this._invincibleCallbackTimer = null;
    this._vx = 0;
    this._vy = 0;
    this._bounds = null;

    const scale = cfg.scale ?? 1;

    this._shadow = scene.add.graphics().setDepth(4);
    this._shadow.fillStyle(0x000000, 0.4);
    this._shadow.fillEllipse(0, 30 * scale, 36 * scale, 10 * scale);
    this._shadow.setPosition(x, y);

    this.graphics = scene.add.graphics();
    this.graphics.setScale(scale);
    this.graphics.setDepth(5);

    this._numberText = scene.add.text(x, y, String(cfg.number), {
      fontSize: `${Math.round(10 * scale)}px`,
      fontFamily: 'Arial Black, sans-serif',
      color: '#111111',
    }).setOrigin(0.5, 0.5).setDepth(5);

    this.x = x;
    this.y = y;
    this._frame = 0;
    this._draw();
    this.graphics.setPosition(x, y);
    this._numberText.setPosition(x, y - 2);

    this._animTimer = scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        this._frame ^= 1;
        this._draw(this._frame);
      },
    });

    this._footBall = scene.add.graphics();
    this._footBall.fillStyle(0xffffff, 1);
    this._footBall.fillCircle(0, 0, 5);
    this._footBall.lineStyle(1, 0xcccccc, 1);
    this._footBall.strokeCircle(0, 0, 5);
    this._footBall.setDepth(4);
    this._footBall.setPosition(x + 14 * scale, y + 20 * scale);
  }

  _draw(frame = 0) {
    const g = this.graphics;
    const { shirtColor, shortsColor, sleeveColor, bootsColor, skinColor } = this._cfg;
    g.clear();

    const leftBootY  = frame === 0 ? 20 : 24;
    const rightBootY = frame === 0 ? 24 : 20;
    g.fillStyle(bootsColor);
    g.fillRect(-9, leftBootY,  8, 6);
    g.fillRect( 2, rightBootY, 8, 6);

    // Shorts with subtle gradient (top lit).
    const shortsTop = lighten(shortsColor, 0.25);
    g.fillGradientStyle(shortsTop, shortsTop, shortsColor, shortsColor, 1);
    g.fillRect(-11, 10, 22, 13);

    // Sleeves with gradient.
    const sleeveTop = lighten(sleeveColor, 0.3);
    g.fillGradientStyle(sleeveTop, sleeveTop, sleeveColor, sleeveColor, 1);
    g.fillRect(-18, -8, 8, 14);
    g.fillRect( 10, -8, 8, 14);

    // Shirt with vertical gradient (floodlit feel).
    const shirtTop = lighten(shirtColor, 0.2);
    const shirtBot = darken(shirtColor, 0.15);
    g.fillGradientStyle(shirtTop, shirtTop, shirtBot, shirtBot, 1);
    g.fillRect(-11, -10, 22, 22);

    // Head with subtle radial-ish gradient via two circles.
    g.fillStyle(darken(skinColor, 0.2));
    g.fillCircle(0, -20, 12);
    g.fillStyle(skinColor);
    g.fillCircle(-1, -22, 10);
    // Rim highlight on top of head.
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(-3, -26, 3);
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
    const scale = this._cfg.scale ?? 1;
    this._shadow.setPosition(x, y);
    this.graphics.setPosition(x, y);
    this._numberText.setPosition(x, y - 2);
    this._footBall.setPosition(x + 14 * scale, y + 20 * scale);
    if (this._shieldGlow) this._shieldGlow.setPosition(x, y);
  }

  setVelocity(vx, vy) {
    this._vx = vx;
    this._vy = vy;
  }

  setBounds(bounds) {
    this._bounds = bounds;
  }

  update(deltaMs) {
    if (!this._bounds) return;
    if (this._vx === 0 && this._vy === 0) return;
    const { x, y } = applyVelocity(this.x, this.y, this._vx, this._vy, deltaMs, this._bounds);
    this.moveTo(x, y);
  }

  startInvincibility(duration) {
    this._invincible = true;
    if (this._flickerTimer) this._flickerTimer.remove();
    if (this._invincibleCallbackTimer) this._invincibleCallbackTimer.remove();
    let visible = true;
    this._flickerTimer = this._scene.time.addEvent({
      delay: 120,
      repeat: Math.floor(duration / 120),
      callback: () => {
        visible = !visible;
        this.graphics.setVisible(visible);
        this._numberText.setVisible(visible);
        this._footBall.setVisible(visible);
        this._shadow.setVisible(visible);
        if (this._shieldGlow) this._shieldGlow.setVisible(visible);
      },
    });
    this._invincibleCallbackTimer = this._scene.time.delayedCall(duration, () => {
      if (this._flickerTimer) { this._flickerTimer.remove(); this._flickerTimer = null; }
      this._invincible = false;
      this.graphics.setVisible(true);
      this._numberText.setVisible(true);
      this._footBall.setVisible(true);
      this._shadow.setVisible(true);
      if (this._shieldGlow) this._shieldGlow.setVisible(true);
    });
  }

  startShield(duration) {
    if (this._shieldGlow) { this._shieldGlow.destroy(); this._shieldGlow = null; }
    const scale = this._cfg.scale ?? 1;
    this._shieldGlow = this._scene.add.graphics();
    this._shieldGlow.fillStyle(0x3b82f6, 0.3);
    this._shieldGlow.fillCircle(0, 0, 38 * scale);
    this._shieldGlow.lineStyle(3, 0x60a5fa, 0.9);
    this._shieldGlow.strokeCircle(0, 0, 38 * scale);
    this._shieldGlow.setPosition(this.x, this.y);
    this._shieldGlow.setDepth(4);

    this.startInvincibility(duration);

    this._scene.time.delayedCall(duration, () => {
      if (this._shieldGlow) { this._shieldGlow.destroy(); this._shieldGlow = null; }
    });
  }

  get isInvincible() { return this._invincible; }

  destroy() {
    if (this._animTimer) this._animTimer.remove();
    if (this._shieldGlow) this._shieldGlow.destroy();
    this._shadow.destroy();
    this.graphics.destroy();
    this._numberText.destroy();
    this._footBall.destroy();
  }
}
