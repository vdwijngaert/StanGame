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
    this._draw();
    this.graphics.setPosition(x, y);
    this._numberText.setPosition(x, y);
  }

  _draw() {
    const g = this.graphics;
    const { shirtColor, shortsColor, sleeveColor, bootsColor, skinColor } = this._cfg;
    g.clear();

    g.fillStyle(bootsColor);
    g.fillRect(-9, 22, 8, 6);
    g.fillRect(2, 22, 8, 6);

    g.fillStyle(shortsColor);
    g.fillRect(-11, 10, 22, 13);

    g.fillStyle(sleeveColor);
    g.fillRect(-18, -8, 8, 14);
    g.fillRect(10, -8, 8, 14);

    g.fillStyle(shirtColor);
    g.fillRect(-11, -10, 22, 22);

    g.fillStyle(skinColor);
    g.fillCircle(0, -20, 12);
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
    this.graphics.setPosition(x, y);
    this._numberText.setPosition(x, y);
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
      },
    });
    this._invincibleCallbackTimer = this._scene.time.delayedCall(duration, () => {
      if (this._flickerTimer) { this._flickerTimer.remove(); this._flickerTimer = null; }
      this._invincible = false;
      this.graphics.setVisible(true);
      this._numberText.setVisible(true);
    });
  }

  get isInvincible() { return this._invincible; }

  destroy() {
    this.graphics.destroy();
    this._numberText.destroy();
  }
}
