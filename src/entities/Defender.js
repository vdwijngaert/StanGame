// src/entities/Defender.js
export class Defender {
  constructor(scene, x, y, speed, scale = 1) {
    this._scene = scene;
    this.speed = speed;
    this._frame = 0;

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

    g.fillStyle(0x8b0000);
    g.fillRect(-11, 10, 22, 13);

    g.fillStyle(0xe74c3c);
    g.fillRect(-18, -8, 8, 14);
    g.fillRect( 10, -8, 8, 14);
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
    if (this._animTimer) this._animTimer.remove();
    this.graphics.destroy();
  }
}
