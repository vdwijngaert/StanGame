// src/scenes/GameOverScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { drawRoundedGradientPanel } from './visuals.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this._score = data.score ?? 0;
    this._highScore = data.highScore ?? 0;
    this._isNewRecord = data.isNewRecord ?? false;
  }

  create() {
    const { width, height } = this.scale;

    // Dark overlay.
    this.add.rectangle(width / 2, height / 2, width, height, 0x05080f, 0.94);

    // Centered glass panel containing title, score, high score.
    const panelW = width - 40;
    const panelH = 360;
    const panelX = width / 2;
    const panelY = height * 0.45;
    const panel = this.add.graphics();
    drawRoundedGradientPanel(panel, -panelW / 2, -panelH / 2, panelW, panelH, {
      topColor: 0x1a2640,
      bottomColor: 0x05080f,
      borderColor: 0xffd700,
      borderAlpha: 0.5,
      borderWidth: 1.5,
      radius: 18,
    });
    panel.setPosition(panelX, panelY);

    // Title.
    this.add.text(width / 2, panelY - panelH / 2 + 50, 'Game Over', {
      fontSize: '42px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#FFD700',
    }).setOrigin(0.5);

    // Score.
    this.add.text(width / 2, panelY - 20, `Score: ${this._score}`, {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // High score.
    const isNew = this._isNewRecord;
    const hsLabel = isNew ? `🏆 Nieuw record: ${this._highScore}!` : `Beste: ${this._highScore}`;
    this.add.text(width / 2, panelY + 20, hsLabel, {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: isNew ? '#FFD700' : '#aaaaaa',
    }).setOrigin(0.5);

    // Opnieuw button — rounded gradient panel + text.
    const btnW = 220;
    const btnH = 62;
    const btnX = width / 2;
    const btnY = height * 0.78;
    const btn = this.add.graphics();
    drawRoundedGradientPanel(btn, -btnW / 2, -btnH / 2, btnW, btnH, {
      topColor: 0xffe680,
      bottomColor: 0xd4a900,
      borderColor: 0xffffff,
      borderAlpha: 0.5,
      borderWidth: 1.5,
      radius: 16,
    });
    btn.setPosition(btnX, btnY);
    const hit = this.add.zone(btnX, btnY, btnW, btnH)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.add.text(btnX, btnY, 'Opnieuw ⚽', {
      fontSize: '22px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#111111',
    }).setOrigin(0.5);

    hit.on('pointerdown', () => this.scene.start('GameScene'));

    // Player name.
    this.add.text(width / 2, height * 0.9, CONFIG.player.name, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#555555',
    }).setOrigin(0.5);
  }
}
