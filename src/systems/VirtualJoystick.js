// src/systems/VirtualJoystick.js
export class VirtualJoystick {
  constructor(cfg) {
    this._cfg = cfg;
    this.active = false;
    this.pointerId = null;
    this.baseX = 0;
    this.baseY = 0;
    this.thumbX = 0;
    this.thumbY = 0;
  }

  onPointerDown(pointerId, x, y) {
    if (this.active) return;
    this.active = true;
    this.pointerId = pointerId;
    this.baseX = x;
    this.baseY = y;
    this.thumbX = x;
    this.thumbY = y;
  }

  onPointerMove(pointerId, x, y) {
    if (!this.active || pointerId !== this.pointerId) return;
    const dx = x - this.baseX;
    const dy = y - this.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const max = this._cfg.thumbMaxRadius;
    if (dist <= max) {
      this.thumbX = x;
      this.thumbY = y;
    } else {
      this.thumbX = this.baseX + (dx / dist) * max;
      this.thumbY = this.baseY + (dy / dist) * max;
    }
  }

  onPointerUp(pointerId) {
    if (!this.active || pointerId !== this.pointerId) return;
    this.active = false;
    this.pointerId = null;
    this.thumbX = this.baseX;
    this.thumbY = this.baseY;
  }

  get vector() {
    if (!this.active) return { x: 0, y: 0, magnitude: 0 };
    const dx = this.thumbX - this.baseX;
    const dy = this.thumbY - this.baseY;
    const mag = Math.sqrt(dx * dx + dy * dy) / this._cfg.thumbMaxRadius;
    if (mag < this._cfg.deadzone) return { x: 0, y: 0, magnitude: 0 };
    return { x: dx / this._cfg.thumbMaxRadius, y: dy / this._cfg.thumbMaxRadius, magnitude: Math.min(mag, 1) };
  }
}
