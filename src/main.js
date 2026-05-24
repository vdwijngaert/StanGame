import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { BirthdayScene } from './scenes/BirthdayScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 480,
  height: 854,
  backgroundColor: '#0a1410',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, BirthdayScene, GameScene, GameOverScene],
});
