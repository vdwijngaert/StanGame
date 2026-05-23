// src/entities/Player.js
export class Player {
  constructor(scene, x, y, cfg) {
    this._scene = scene;
    this._cfg = cfg;
    this._invincible = false;
    this._flickerTimer = null;
    this._invincibleCallbackTimer = null;

    const scale = cfg.scale ?? 1;

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

    g.fillStyle(shortsColor);
    g.fillRect(-11, 10, 22, 13);

    g.fillStyle(sleeveColor);
    g.fillRect(-18, -8, 8, 14);
    g.fillRect( 10, -8, 8, 14);

    g.fillStyle(shirtColor);
    g.fillRect(-11, -10, 22, 22);

    g.fillStyle(skinColor);
    g.fillCircle(0, -20, 12);
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
    const scale = this._cfg.scale ?? 1;
    this.graphics.setPosition(x, y);
    this._numberText.setPosition(x, y - 2);
    this._footBall.setPosition(x + 14 * scale, y + 20 * scale);
    if (this._shieldGlow) this._shieldGlow.setPosition(x, y);
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
      },
    });
    this._invincibleCallbackTimer = this._scene.time.delayedCall(duration, () => {
      if (this._flickerTimer) { this._flickerTimer.remove(); this._flickerTimer = null; }
      this._invincible = false;
      this.graphics.setVisible(true);
      this._numberText.setVisible(true);
      this._footBall.setVisible(true);
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
    this.graphics.destroy();
    this._numberText.destroy();
    this._footBall.destroy();
  }
}
