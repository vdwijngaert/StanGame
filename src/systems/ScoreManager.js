// src/systems/ScoreManager.js
const LS_KEY = 'stan_runner_highscore';

export class ScoreManager {
  constructor(cfg) {
    this._cfg = cfg;
    this.score = 0;
    this._distancePx = 0;
    this._distanceScore = 0; // points from distance only
    this._bonusScore = 0;    // points from balls
    // localStorage.getItem returns null when missing; parseInt(null) = NaN, so fallback to '0'
    this.highScore = parseInt(localStorage.getItem(LS_KEY) ?? '0', 10);
  }

  addDistance(px) {
    this._distancePx += px;
    this._distanceScore = Math.floor(this._distancePx / this._cfg.distancePerPoint);
    this.score = this._distanceScore + this._bonusScore;
  }

  collectBall() {
    this._bonusScore += this._cfg.ballBonus;
    this.score += this._cfg.ballBonus;
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(LS_KEY, this.score);
    }
  }
}
