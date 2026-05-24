// src/scenes/BirthdayScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { createMuteButton } from './visuals.js';

export class BirthdayScene extends Phaser.Scene {
  constructor() { super('BirthdayScene'); }

  create() {
    const { width, height } = this.scale;
    const { player, birthday } = CONFIG;

    // Yellow background
    this.add.rectangle(width / 2, height / 2, width, height, 0xFFD700);

    // Main message
    const msg = this.add.text(width / 2, height * 0.35, birthday.message, {
      fontSize: '32px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#111111',
      align: 'center',
      wordWrap: { width: width - 60 },
    }).setOrigin(0.5);

    // Bounce in animation
    msg.setScale(0);
    this.tweens.add({
      targets: msg,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.Out',
    });

    // Subtitle
    this.add.text(width / 2, height * 0.55, `${player.club} · #${player.number}`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#333333',
    }).setOrigin(0.5);

    // Spelen! button
    const btn = this.add.rectangle(width / 2, height * 0.72, 180, 55, 0x111111, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height * 0.72, 'Spelen! ⚽', {
      fontSize: '22px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#FFD700',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => this.scene.start('GameScene'));

    const audio = this.registry.get('audio');
    const muteBtn = createMuteButton(this, audio);
    muteBtn.setPosition(width - 20, 32);
  }
}
