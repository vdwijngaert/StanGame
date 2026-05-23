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

    this.graphics = scene.add.graphics();
    this.x = x;
    this.y = y;
    this._draw();
  }

  _draw() {
    const g = this.graphics;
    g.clear();
    // White ball
    g.fillStyle(0xFFFFFF);
    g.fillCircle(0, 0, 12);
    // Black pentagon patches (simplified: 5 small dots)
    g.fillStyle(0x111111);
    g.fillCircle(0, 0, 3);
    g.fillCircle(0, -7, 2.5);
    g.fillCircle(6, 4, 2.5);
    g.fillCircle(-6, 4, 2.5);
    // Gold glow outline
    g.lineStyle(2, 0xFFD700, 1);
    g.strokeCircle(0, 0, 12);
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
