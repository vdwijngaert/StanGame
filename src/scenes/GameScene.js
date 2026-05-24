// src/scenes/GameScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DifficultyManager } from '../systems/DifficultyManager.js';
import { ScoreManager } from '../systems/ScoreManager.js';
import { Player } from '../entities/Player.js';
import { Defender } from '../entities/Defender.js';
import { Ball } from '../entities/Ball.js';
import { Shield } from '../entities/Shield.js';
import { VirtualJoystick } from '../systems/VirtualJoystick.js';
import { drawRoundedGradientPanel, spawnBurst, spawnRing, createMuteButton } from './visuals.js';

const STRIPE_WIDTH = 80;
const NUM_STRIPES = 14;
const STRIPE_DARK = 0x0c2912;
const STRIPE_LIGHT = 0x143820;

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
    this._shields = [];
    this._shieldTimer = 0;
    this._audio = this.registry.get('audio');

    // --- Pitch ---
    this._stripes = [];
    for (let i = 0; i < NUM_STRIPES; i++) {
      const color = i % 2 === 0 ? STRIPE_DARK : STRIPE_LIGHT;
      const stripe = this.add.rectangle(
        i * STRIPE_WIDTH + STRIPE_WIDTH / 2,
        height / 2,
        STRIPE_WIDTH,
        height,
        color
      );
      this._stripes.push(stripe);
    }

    // Static field sidelines (top + bottom).
    const lines = this.add.graphics().setDepth(1);
    lines.lineStyle(2, 0xffffff, 0.4);
    lines.lineBetween(0, 48, width, 48);
    lines.lineBetween(0, height - 28, width, height - 28);

    // Floodlight ellipse anchored to player.
    this._floodlight = this.add.graphics().setDepth(2);
    this._floodlight.fillStyle(0xfff4c2, 0.08);
    this._floodlight.fillEllipse(0, 0, 360, 260);
    this._floodlight.fillStyle(0xfff4c2, 0.10);
    this._floodlight.fillEllipse(0, 0, 220, 160);

    // Corner vignette overlay (four gradient rects).
    this._buildVignette(width, height);

    // --- Player ---
    this._player = new Player(this, width * 0.25, height * 0.6, CONFIG.player);

    // --- HUD ---
    this._buildHud(width, height);

    // --- Input ---
    this._joystick = new VirtualJoystick(CONFIG.controls.joystick);
    this._joystickBase = this.add.graphics().setDepth(15).setScrollFactor(0).setVisible(false);
    this._joystickThumb = this.add.graphics().setDepth(15).setScrollFactor(0).setVisible(false);

    this.input.on('pointerdown', (ptr) => {
      this._joystick.onPointerDown(ptr.id, ptr.x, ptr.y);
      this._renderJoystick();
    });
    this.input.on('pointermove', (ptr) => {
      this._joystick.onPointerMove(ptr.id, ptr.x, ptr.y);
      this._renderJoystick();
    });
    this.input.on('pointerup', (ptr) => {
      this._joystick.onPointerUp(ptr.id);
      this._renderJoystick();
    });

    this._cursors = this.input.keyboard.createCursorKeys();

    // --- Player bounds (clamp to pitch, clear of HUD) ---
    const scale = CONFIG.player.scale;
    const halfW = 18 * scale;
    const halfH = 30 * scale;
    this._player.setBounds({
      minX: halfW,
      minY: 80,
      maxX: width - halfW,
      maxY: height - halfH,
    });

    this._audio?.startMusic();
  }

  _buildHud(width, height) {
    // Top HUD panel — glassmorphism strip behind hearts & score.
    const panelW = 240;
    const panelH = 44;
    this._heartPanel = this.add.graphics().setScrollFactor(0).setDepth(9);
    drawRoundedGradientPanel(this._heartPanel, -panelW / 2, -panelH / 2, panelW, panelH, {
      topColor: 0x1a2640,
      bottomColor: 0x05080f,
      borderColor: 0xffffff,
      borderAlpha: 0.22,
    });
    this._heartPanel.setPosition(8 + panelW / 2, 8 + panelH / 2);

    // Hearts with subtle red halo behind each.
    this._heartTexts = [];
    this._heartHalos = [];
    for (let i = 0; i < CONFIG.lives; i++) {
      const cx = 28 + i * 36;
      const cy = 30;
      const halo = this.add.graphics().setScrollFactor(0).setDepth(9);
      halo.fillStyle(0xef4444, 0.45);
      halo.fillCircle(0, 0, 14);
      halo.setPosition(cx, cy);
      this._heartHalos.push(halo);

      const t = this.add.text(cx, cy, '❤️', { fontSize: '22px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(10);
      this._heartTexts.push(t);
    }

    this._levelText = this.add.text(8 + panelW - 56, 30, 'LVL 1', {
      fontSize: '15px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#FFD700',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    // Score badge — rounded gradient panel.
    const scoreW = 130;
    const scoreH = 44;
    const scoreCx = width - scoreW / 2 - 8;
    const scoreCy = 8 + scoreH / 2;
    this._scoreBg = this.add.graphics().setScrollFactor(0).setDepth(9);
    drawRoundedGradientPanel(this._scoreBg, -scoreW / 2, -scoreH / 2, scoreW, scoreH, {
      topColor: 0x1a2640,
      bottomColor: 0x05080f,
      borderColor: 0xffd700,
      borderAlpha: 0.55,
      borderWidth: 1.5,
    });
    this._scoreBg.setPosition(scoreCx, scoreCy);

    // Shadow text behind score for legibility.
    this._scoreShadow = this.add.text(scoreCx + 1, scoreCy + 1, '0', {
      fontSize: '20px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#000000',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9).setAlpha(0.6);
    this._scoreText = this.add.text(scoreCx, scoreCy, '0', {
      fontSize: '20px',
      fontFamily: 'Arial Black, sans-serif',
      color: CONFIG.player.shirtColorHex,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    // Mute button — below the score badge, top-right.
    const muteBtn = createMuteButton(this, this._audio);
    muteBtn.setPosition(width - 20, 76);
  }

  _buildVignette(width, height) {
    // Subtle dark vignette using overlapping radial-ish gradients via four corner triangles.
    const v = this.add.graphics().setDepth(3);
    const alphaCorner = 0.55;
    const alphaCenter = 0;
    // Four corners. Each is a rectangle with a gradient fading toward center.
    // Top-left
    v.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, alphaCorner, alphaCenter, alphaCenter, alphaCenter);
    v.fillRect(0, 0, width / 2, height / 2);
    // Top-right
    v.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, alphaCenter, alphaCorner, alphaCenter, alphaCenter);
    v.fillRect(width / 2, 0, width / 2, height / 2);
    // Bottom-left
    v.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, alphaCenter, alphaCenter, alphaCorner, alphaCenter);
    v.fillRect(0, height / 2, width / 2, height / 2);
    // Bottom-right
    v.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, alphaCenter, alphaCenter, alphaCenter, alphaCorner);
    v.fillRect(width / 2, height / 2, width / 2, height / 2);
  }

  _renderJoystick() {
    const j = this._joystick;
    if (!j.active) {
      this._joystickBase.setVisible(false);
      this._joystickThumb.setVisible(false);
      return;
    }
    const cfg = CONFIG.controls.joystick;
    this._joystickBase.clear();
    this._joystickBase.lineStyle(4, 0xffffff, 0.35);
    this._joystickBase.strokeCircle(j.baseX, j.baseY, cfg.baseRadius);
    this._joystickBase.setVisible(true);

    this._joystickThumb.clear();
    this._joystickThumb.fillStyle(0xffffff, 0.55);
    this._joystickThumb.fillCircle(j.thumbX, j.thumbY, 22);
    this._joystickThumb.setVisible(true);
  }

  _inputVector() {
    if (this._joystick.active) {
      const v = this._joystick.vector;
      return { x: v.x, y: v.y };
    }
    const c = this._cursors;
    let x = 0, y = 0;
    if (c.left.isDown)  x -= 1;
    if (c.right.isDown) x += 1;
    if (c.up.isDown)    y -= 1;
    if (c.down.isDown)  y += 1;
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
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
    const v = this._inputVector();
    this._player.setVelocity(v.x * CONFIG.controls.playerMaxSpeed, v.y * CONFIG.controls.playerMaxSpeed);
    this._player.update(delta);
    this._checkCollisions();
    this._score.addDistance(this._difficulty.scrollSpeed * (delta / 1000));
    const scoreStr = String(this._score.score);
    this._scoreText.setText(scoreStr);
    this._scoreShadow.setText(scoreStr);
    this._levelText.setText('LVL ' + this._difficulty.level);
    this._updateHudHearts();
    this._floodlight.setPosition(this._player.x, this._player.y);
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
    this._shieldTimer += delta;
    if (this._shieldTimer >= CONFIG.shield.spawnInterval) {
      this._shieldTimer = 0;
      if (Math.random() < CONFIG.shield.spawnChance) this._spawnShield();
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

  _spawnShield() {
    const { width, height } = this.scale;
    const y = Phaser.Math.Between(80, height - 80);
    this._shields.push(new Shield(this, width + 30, y, this._difficulty.scrollSpeed * 0.7));
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
    for (const sh of this._shields) sh.update(delta);
    this._shields = this._shields.filter(sh => {
      if (sh.isOffScreen(-30)) { sh.destroy(); return false; }
      return true;
    });
  }

  _checkCollisions() {
    const px = this._player.x;
    const py = this._player.y;
    const s = CONFIG.player.scale;

    // Shields and balls can be collected even while invincible/shielded
    for (let i = this._shields.length - 1; i >= 0; i--) {
      const sh = this._shields[i];
      if (Phaser.Math.Distance.Between(px, py, sh.x, sh.y) < 24 * s) {
        spawnRing(this, sh.x, sh.y, { color: 0x60a5fa, startRadius: 14, endRadius: 90, duration: 550 });
        spawnBurst(this, sh.x, sh.y, { color: 0x93c5fd, count: 8, distance: 60, radius: 3 });
        this._audio?.play('shieldOn');
        this._player.startShield(CONFIG.shield.duration);
        sh.destroy();
        this._shields.splice(i, 1);
        break;
      }
    }

    for (let i = this._balls.length - 1; i >= 0; i--) {
      const b = this._balls[i];
      if (Phaser.Math.Distance.Between(px, py, b.x, b.y) < 28 * s) {
        spawnBurst(this, b.x, b.y, { color: 0xffd700, count: 12, distance: 55, radius: 3 });
        this._score.collectBall();
        this._audio?.play('ball');
        this._playGoalAnimation();
        this._playBallBonusFeedback();
        b.destroy();
        this._balls.splice(i, 1);
      }
    }

    if (this._player.isInvincible) return;

    for (const d of this._defenders) {
      if (Phaser.Math.Distance.Between(px, py, d.x, d.y) < 34 * s) {
        this._loseLife();
        return;
      }
    }
  }

  _loseLife() {
    this._lives--;
    this._audio?.play('hit');
    if (this._lives <= 0) {
      this._gameOver = true;
      this._audio?.stopMusic();
      this._audio?.play('gameOver');
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

  _playBallBonusFeedback() {
    // Pulse the score badge (text + shadow + background) together.
    this.tweens.killTweensOf([this._scoreText, this._scoreShadow, this._scoreBg]);
    this._scoreText.setScale(1);
    this._scoreShadow.setScale(1);
    this._scoreBg.setScale(1);
    this.tweens.add({
      targets: [this._scoreText, this._scoreShadow, this._scoreBg],
      scale: 1.3,
      duration: 120,
      ease: 'Back.easeOut',
      yoyo: true,
    });

    // Brief color flash on the score number.
    this._scoreText.setColor('#FFFFFF');
    this.time.delayedCall(180, () => {
      this._scoreText.setColor(CONFIG.player.shirtColorHex);
    });

    // Floating "+N" popup just below the badge.
    const bonus = CONFIG.scoring.ballBonus;
    const pop = this.add.text(this._scoreBg.x, this._scoreBg.y + 26, '+' + bonus, {
      fontSize: '20px',
      fontFamily: 'Arial Black, sans-serif',
      color: CONFIG.player.shirtColorHex,
      stroke: '#111111',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20);

    this.tweens.add({
      targets: pop,
      y: pop.y + 30,
      alpha: 0,
      duration: 700,
      ease: 'Power1',
      onComplete: () => pop.destroy(),
    });
  }

  _playGoalAnimation() {
    const { width, height } = this.scale;
    const txt = this.add.text(width / 2, height / 2, '⚽ GOAL!', {
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
    this._audio?.play('levelUp');
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
