// src/entities/Defender.js
export class Defender {
  constructor(scene, x, y, speed, scale = 1) {
    this._scene = scene;
    this.speed = speed;

    this.graphics = scene.add.graphics();
    this.graphics.setScale(scale);
    this.x = x;
    this.y = y;
    this._draw();
    this.graphics.setPosition(x, y);
  }

  _draw() {
    const g = this.graphics;
    g.clear();

    g.fillStyle(0x222222);
    g.fillRect(-9, 22, 8, 6);
    g.fillRect(2, 22, 8, 6);

    g.fillStyle(0x8b0000);
    g.fillRect(-11, 10, 22, 13);

    g.fillStyle(0xe74c3c);
    g.fillRect(-18, -8, 8, 14);
    g.fillRect(10, -8, 8, 14);
    g.fillRect(-11, -10, 22, 22);

    g.fillStyle(0xFFDAAB);
    g.fillCircle(0, -20, 12);
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
