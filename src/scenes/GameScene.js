// src/scenes/GameScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DifficultyManager } from '../systems/DifficultyManager.js';
import { ScoreManager } from '../systems/ScoreManager.js';
import { Player } from '../entities/Player.js';
import { Defender } from '../entities/Defender.js';
import { Ball } from '../entities/Ball.js';

const STRIPE_WIDTH = 80;
const NUM_STRIPES = 14;

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const { width, height } = this.scale;

    this._difficulty = new DifficultyManager(CONFIG.difficulty);
    this._score = new ScoreManager(CONFIG.scoring);
    this._defenders = [];
    this._balls = [];
    this._lives = CONFIG.lives;
    this._gameOver = false;
    this._spawnTimer = 0;
    this._ballTimer = 0;

    // --- Pitch ---
    this._stripes = [];
    for (let i = 0; i < NUM_STRIPES; i++) {
      const color = i % 2 === 0 ? 0x2d5a1b : 0x265218;
      const stripe = this.add.rectangle(
        i * STRIPE_WIDTH + STRIPE_WIDTH / 2,
        height / 2,
        STRIPE_WIDTH,
        height,
        color
      );
      this._stripes.push(stripe);
    }

    // --- Player ---
    this._player = new Player(this, width * 0.25, height * 0.6, CONFIG.player);

    // --- HUD ---
    this._buildHud(width, height);

    // --- Pointer input ---
    this.input.on('pointermove', (ptr) => {
      if (ptr.isDown) this._player.moveTo(ptr.x, ptr.y);
    });
    this.input.on('pointerdown', (ptr) => {
      this._player.moveTo(ptr.x, ptr.y);
    });
  }

  _buildHud(width, height) {
    // Hearts
    this._heartTexts = [];
    for (let i = 0; i < CONFIG.lives; i++) {
      const t = this.add.text(18 + i * 32, 18, '❤️', { fontSize: '22px' })
        .setScrollFactor(0).setDepth(10);
      this._heartTexts.push(t);
    }

    this._levelText = this.add.text(18, 48, 'LVL 1', {
      fontSize: '16px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#FFD700',
      stroke: '#111111',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(10);

    // Score badge background
    this._scoreBg = this.add.rectangle(width - 70, 28, 120, 36, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(10).setOrigin(0.5);
    this._scoreText = this.add.text(width - 70, 28, '0m', {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: CONFIG.player.shirtColorHex,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
  }

  update(time, delta) {
    if (this._gameOver) return;
    this._scrollPitch(delta);
    this._difficulty.update(delta);
    if (this._difficulty.justLeveledUp) {
      this._playLevelUpAnimation(this._difficulty.level);
    }
    this._updateSpawns(delta);
    this._updateEntities(delta);
    this._checkCollisions();
    this._score.addDistance(this._difficulty.scrollSpeed * (delta / 1000));
    if (this._score.checkGoal()) this._playGoalAnimation();
    this._scoreText.setText(this._score.score + 'm');
    this._levelText.setText('LVL ' + this._difficulty.level);
    this._updateHudHearts();
  }

  _scrollPitch(delta) {
    const move = this._difficulty.scrollSpeed * (delta / 1000);
    for (const stripe of this._stripes) {
      stripe.x -= move;
      if (stripe.x < -STRIPE_WIDTH / 2) {
        stripe.x += NUM_STRIPES * STRIPE_WIDTH;
      }
    }
  }

  _updateSpawns(delta) {
    this._spawnTimer += delta;
    this._ballTimer += delta;

    if (this._spawnTimer >= this._difficulty.spawnInterval) {
      this._spawnTimer = 0;
      this._spawnDefender();
    }
    if (this._ballTimer >= 3000) {
      this._ballTimer = 0;
      if (Math.random() < 0.5) this._spawnBall();
    }
  }

  _spawnDefender() {
    const { width, height } = this.scale;
    const y = Phaser.Math.Between(60, height - 60);
    this._defenders.push(
      new Defender(this, width + 30, y, this._difficulty.scrollSpeed * 0.9, CONFIG.player.scale)
    );
  }

  _spawnBall() {
    const { width, height } = this.scale;
    const y = Phaser.Math.Between(60, height - 60);
    this._balls.push(new Ball(this, width + 30, y, this._difficulty.scrollSpeed * 0.7));
  }

  _updateEntities(delta) {
    for (const d of this._defenders) d.update(delta);
    for (const b of this._balls) b.update(delta);

    this._defenders = this._defenders.filter(d => {
      if (d.isOffScreen(-50)) { d.destroy(); return false; }
      return true;
    });
    this._balls = this._balls.filter(b => {
      if (b.isOffScreen(-30)) { b.destroy(); return false; }
      return true;
    });
  }

  _checkCollisions() {
    if (this._player.isInvincible) return;

    const px = this._player.x;
    const py = this._player.y;
    const s = CONFIG.player.scale;

    for (const d of this._defenders) {
      if (Phaser.Math.Distance.Between(px, py, d.x, d.y) < 34 * s) {
        this._loseLife();
        return;
      }
    }

    for (let i = this._balls.length - 1; i >= 0; i--) {
      const b = this._balls[i];
      if (Phaser.Math.Distance.Between(px, py, b.x, b.y) < 28 * s) {
        this._score.collectBall();
        b.destroy();
        this._balls.splice(i, 1);
      }
    }
  }

  _loseLife() {
    this._lives--;
    if (this._lives <= 0) {
      this._gameOver = true;
      const isNewRecord = this._score.score > this._score.highScore;
      this._score.saveHighScore();
      this.time.delayedCall(600, () => {
        this.scene.start('GameOverScene', {
          score: this._score.score,
          highScore: this._score.highScore,
          isNewRecord,
        });
      });
    }
    this._player.startInvincibility(CONFIG.invincibilityDuration);
  }

  _updateHudHearts() {
    for (let i = 0; i < this._heartTexts.length; i++) {
      this._heartTexts[i].setAlpha(i < this._lives ? 1 : 0.2);
    }
  }

  _playGoalAnimation() {
    const { width, height } = this.scale;
    const txt = this.add.text(width / 2, height / 2, '⚽ GOAL! +100', {
      fontSize: '36px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#FFD700',
      stroke: '#111111',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: txt,
      y: height / 2 - 80,
      alpha: 0,
      duration: 1400,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  _playLevelUpAnimation(level) {
    const { width, height } = this.scale;
    const txt = this.add.text(width / 2, height / 2, `LEVEL ${level}! 🔥`, {
      fontSize: '36px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#FFD700',
      stroke: '#111111',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: txt,
      y: height / 2 - 80,
      alpha: 0,
      duration: 1400,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }
}
