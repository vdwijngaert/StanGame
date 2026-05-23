// src/systems/DifficultyManager.js
export class DifficultyManager {
  constructor(cfg) {
    this._cfg = cfg;
    this._elapsed = 0;
    this.level = 1;
    this.scrollSpeed = cfg.initialSpeed;
    this.spawnInterval = cfg.initialSpawnInterval;
  }

  update(deltaMs) {
    this._elapsed += deltaMs;
    const targetLevel = Math.floor(this._elapsed / this._cfg.levelUpInterval) + 1;
    if (targetLevel > this.level) {
      const gained = targetLevel - this.level;
      this.level = targetLevel;
      this.scrollSpeed += this._cfg.speedIncrement * gained;
      this.spawnInterval = Math.max(
        this._cfg.minSpawnInterval,
        this.spawnInterval - this._cfg.spawnIntervalDecrement * gained
      );
    }
  }
}
