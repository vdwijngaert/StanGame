// src/entities/Shield.js
export class Shield {
  constructor(scene, x, y, speed) {
    this._scene = scene;
    this.speed = speed;
    this.graphics = scene.add.graphics();
    this.x = x;
    this.y = y;
    this._draw();
    this.graphics.setPosition(x, y);
  }

  _draw() {
    const g = this.graphics;
    g.clear();
    // Shield body
    g.fillStyle(0x3b82f6);
    g.fillRect(-11, -14, 22, 18);
    // Bottom point
    g.fillTriangle(-11, 4, 11, 4, 0, 16);
    // Border
    g.lineStyle(2, 0x93c5fd, 1);
    g.strokeRect(-11, -14, 22, 18);
    // Tick mark
    g.lineStyle(2.5, 0xffffff, 1);
    g.lineBetween(-5, -2, -1, 4);
    g.lineBetween(-1, 4, 7, -5);
  }

  update(delta) {
    this.x -= this.speed * (delta / 1000);
    this.graphics.setPosition(this.x, this.y);
  }

  isOffScreen(leftBound) {
    return this.x < leftBound;
  }

  destroy() {
    this.graphics.destroy();
  }
}
