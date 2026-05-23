// src/entities/Player.js
export class Player {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} cfg  - CONFIG.player
   */
  constructor(scene, x, y, cfg) {
    this._scene = scene;
    this._cfg = cfg;
    this._invincible = false;
    this._flickerTimer = null;

    this.graphics = scene.add.graphics();
    this.x = x;
    this.y = y;
    this._draw();
  }

  _draw() {
    const g = this.graphics;
    const { shirtColor, shortsColor, sleeveColor, bootsColor, skinColor, number } = this._cfg;
    g.clear();

    // Boots
    g.fillStyle(bootsColor);
    g.fillRect(-9, 22, 8, 6);
    g.fillRect(2, 22, 8, 6);

    // Shorts
    g.fillStyle(shortsColor);
    g.fillRect(-11, 10, 22, 13);

    // Sleeves
    g.fillStyle(sleeveColor);
    g.fillRect(-18, -8, 8, 14);
    g.fillRect(10, -8, 8, 14);

    // Shirt body
    g.fillStyle(shirtColor);
    g.fillRect(-11, -10, 22, 22);

    // Jersey number
    const text = this._scene.add.text(0, -2, String(number), {
      fontSize: '10px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#111111',
    }).setOrigin(0.5, 0.5);
    this._numberText = text;

    // Head
    g.fillStyle(skinColor);
    g.fillCircle(0, -20, 12);
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
    this.graphics.setPosition(x, y);
    if (this._numberText) this._numberText.setPosition(x, y - 2);
  }

  startInvincibility(duration) {
    this._invincible = true;
    if (this._flickerTimer) this._flickerTimer.remove();
    let visible = true;
    this._flickerTimer = this._scene.time.addEvent({
      delay: 120,
      repeat: Math.floor(duration / 120),
      callback: () => {
        visible = !visible;
        this.graphics.setVisible(visible);
        if (this._numberText) this._numberText.setVisible(visible);
      },
    });
    this._scene.time.delayedCall(duration, () => {
      this._invincible = false;
      this.graphics.setVisible(true);
      if (this._numberText) this._numberText.setVisible(true);
    });
  }

  get isInvincible() { return this._invincible; }

  destroy() {
    this.graphics.destroy();
    if (this._numberText) this._numberText.destroy();
  }
}
