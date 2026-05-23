// src/entities/Defender.js
export class Defender {
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

    // Boots
    g.fillStyle(0x222222);
    g.fillRect(-9, 22, 8, 6);
    g.fillRect(2, 22, 8, 6);

    // Shorts
    g.fillStyle(0x8b0000);
    g.fillRect(-11, 10, 22, 13);

    // Shirt
    g.fillStyle(0xe74c3c);
    g.fillRect(-18, -8, 8, 14);  // left sleeve
    g.fillRect(10, -8, 8, 14);   // right sleeve
    g.fillRect(-11, -10, 22, 22); // body

    // Head
    g.fillStyle(0xFFDAAB);
    g.fillCircle(0, -20, 12);
  }

  update(delta) {
    this.x -= this.speed * (delta / 1000);
    this.graphics.setPosition(this.x, this.y);
  }

  isOffScreen(leftBound) {
    return this.x < leftBound - 50;
  }

  destroy() {
    this.graphics.destroy();
  }
}
