// src/scenes/BootScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const next = CONFIG.birthday.show ? 'BirthdayScene' : 'GameScene';
    this.scene.start(next);
  }
}
