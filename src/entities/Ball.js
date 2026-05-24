// src/entities/Ball.js
export class Ball {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {number} speed  px/s
   */
  constructor(scene, x, y, speed) {
    this._scene = scene;
    this.speed = speed;

    this._halo = scene.add.graphics();
    this._halo.fillStyle(0xffd700, 0.25);
    this._halo.fillCircle(0, 0, 22);
    this._halo.fillStyle(0xffd700, 0.4);
    this._halo.fillCircle(0, 0, 16);
    this._halo.setPosition(x, y);

    this._shadow = scene.add.graphics();
    this._shadow.fillStyle(0x000000, 0.3);
    this._shadow.fillEllipse(0, 14, 22, 6);
    this._shadow.setPosition(x, y);

    this.graphics = scene.add.graphics();
    this.x = x;
    this.y = y;
    this._draw();
    this.graphics.setPosition(x, y);

    // Subtle halo pulse so it feels alive.
    this._haloTween = scene.tweens.add({
      targets: this._halo,
      scale: 1.15,
      alpha: 0.7,
      duration: 700,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  _draw() {
    const g = this.graphics;
    g.clear();
    // Ball with vertical gradient (top-lit).
    g.fillGradientStyle(0xffffff, 0xffffff, 0xc8c8c8, 0xc8c8c8, 1);
    g.fillCircle(0, 0, 12);
    // Black pentagon patches (simplified).
    g.fillStyle(0x111111);
    g.fillCircle(0, 0, 3);
    g.fillCircle(0, -7, 2.5);
    g.fillCircle(6, 4, 2.5);
    g.fillCircle(-6, 4, 2.5);
    // Gold outline.
    g.lineStyle(2, 0xFFD700, 1);
    g.strokeCircle(0, 0, 12);
    // Top highlight.
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(-4, -5, 2);
  }

  update(delta) {
    this.x -= this.speed * (delta / 1000);
    this.graphics.setPosition(this.x, this.y);
    this._halo.setPosition(this.x, this.y);
    this._shadow.setPosition(this.x, this.y);
  }

  isOffScreen(leftBound) {
    return this.x < leftBound;
  }

  destroy() {
    if (this._haloTween) this._haloTween.stop();
    this._halo.destroy();
    this._shadow.destroy();
    this.graphics.destroy();
  }
}
