// src/scenes/GameOverScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this._score = data.score ?? 0;
    this._highScore = data.highScore ?? 0;
  }

  create() {
    const { width, height } = this.scale;

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x111111, 0.92);

    // Title
    this.add.text(width / 2, height * 0.2, 'Game Over', {
      fontSize: '42px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#FFD700',
    }).setOrigin(0.5);

    // Score
    this.add.text(width / 2, height * 0.38, `Score: ${this._score}m`, {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // High score
    const isNew = this._score > this._highScore;
    const hsLabel = isNew ? `🏆 Nieuw record: ${this._highScore}m!` : `Beste: ${this._highScore}m`;
    this.add.text(width / 2, height * 0.48, hsLabel, {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: isNew ? '#FFD700' : '#aaaaaa',
    }).setOrigin(0.5);

    // Opnieuw button
    const btn = this.add.rectangle(width / 2, height * 0.65, 200, 58, 0xFFD700)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height * 0.65, 'Opnieuw ⚽', {
      fontSize: '22px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#111111',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => this.scene.start('GameScene'));

    // Player name
    this.add.text(width / 2, height * 0.82, CONFIG.player.name, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#555555',
    }).setOrigin(0.5);
  }
}
