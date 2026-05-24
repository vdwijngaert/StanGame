// src/entities/Shield.js
export class Shield {
  constructor(scene, x, y, speed) {
    this._scene = scene;
    this.speed = speed;

    this._halo = scene.add.graphics();
    this._halo.fillStyle(0x60a5fa, 0.22);
    this._halo.fillCircle(0, 0, 26);
    this._halo.fillStyle(0x60a5fa, 0.35);
    this._halo.fillCircle(0, 0, 18);
    this._halo.setPosition(x, y);

    this.graphics = scene.add.graphics();
    this.x = x;
    this.y = y;
    this._draw();
    this.graphics.setPosition(x, y);

    this._haloTween = scene.tweens.add({
      targets: this._halo,
      scale: 1.15,
      alpha: 0.75,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  _draw() {
    const g = this.graphics;
    g.clear();
    // Shield body with gradient (light cyan top → deep blue bottom).
    g.fillGradientStyle(0x93c5fd, 0x93c5fd, 0x1d4ed8, 0x1d4ed8, 1);
    g.fillRect(-11, -14, 22, 18);
    // Bottom point (single color near the dark base).
    g.fillStyle(0x1d4ed8);
    g.fillTriangle(-11, 4, 11, 4, 0, 16);
    // Border.
    g.lineStyle(2, 0xbfdbfe, 1);
    g.strokeRect(-11, -14, 22, 18);
    // Tick mark.
    g.lineStyle(2.5, 0xffffff, 1);
    g.lineBetween(-5, -2, -1, 4);
    g.lineBetween(-1, 4, 7, -5);
    // Top highlight on body.
    g.fillStyle(0xffffff, 0.4);
    g.fillRect(-9, -12, 4, 3);
  }

  update(delta) {
    this.x -= this.speed * (delta / 1000);
    this.graphics.setPosition(this.x, this.y);
    this._halo.setPosition(this.x, this.y);
  }

  isOffScreen(leftBound) {
    return this.x < leftBound;
  }

  destroy() {
    if (this._haloTween) this._haloTween.stop();
    this._halo.destroy();
    this.graphics.destroy();
  }
}
