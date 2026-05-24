// src/entities/Defender.js

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

export class Defender {
  constructor(scene, x, y, speed, scale = 1) {
    this._scene = scene;
    this.speed = speed;
    this._frame = 0;

    this._shadow = scene.add.graphics();
    this._shadow.fillStyle(0x000000, 0.4);
    this._shadow.fillEllipse(0, 30 * scale, 36 * scale, 10 * scale);
    this._shadow.setPosition(x, y);

    this.graphics = scene.add.graphics();
    this.graphics.setScale(scale);
    this.x = x;
    this.y = y;
    this._draw(0);
    this.graphics.setPosition(x, y);

    this._animTimer = scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        this._frame ^= 1;
        this._draw(this._frame);
      },
    });
  }

  _draw(frame = 0) {
    const g = this.graphics;
    g.clear();

    const leftBootY  = frame === 0 ? 20 : 24;
    const rightBootY = frame === 0 ? 24 : 20;
    g.fillStyle(0x222222);
    g.fillRect(-9, leftBootY,  8, 6);
    g.fillRect( 2, rightBootY, 8, 6);

    // Shorts with gradient.
    g.fillGradientStyle(0xa30000, 0xa30000, 0x6b0000, 0x6b0000, 1);
    g.fillRect(-11, 10, 22, 13);

    // Sleeves with gradient.
    const sleeveTop = lighten(0xe74c3c, 0.15);
    const sleeveBot = darken(0xe74c3c, 0.2);
    g.fillGradientStyle(sleeveTop, sleeveTop, sleeveBot, sleeveBot, 1);
    g.fillRect(-18, -8, 8, 14);
    g.fillRect( 10, -8, 8, 14);

    // Shirt with gradient (floodlit feel).
    g.fillGradientStyle(sleeveTop, sleeveTop, sleeveBot, sleeveBot, 1);
    g.fillRect(-11, -10, 22, 22);

    // Head with shading.
    g.fillStyle(darken(0xFFDAAB, 0.2));
    g.fillCircle(0, -20, 12);
    g.fillStyle(0xFFDAAB);
    g.fillCircle(-1, -22, 10);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(-3, -26, 3);
  }

  update(delta) {
    this.x -= this.speed * (delta / 1000);
    this.graphics.setPosition(this.x, this.y);
    this._shadow.setPosition(this.x, this.y);
  }

  isOffScreen(leftBound) {
    return this.x < leftBound;
  }

  destroy() {
    if (this._animTimer) this._animTimer.remove();
    this._shadow.destroy();
    this.graphics.destroy();
  }
}
