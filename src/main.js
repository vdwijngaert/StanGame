import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { AudioSystem } from './systems/AudioSystem.js';
import { BootScene } from './scenes/BootScene.js';
import { BirthdayScene } from './scenes/BirthdayScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const audio = new AudioSystem({ config: CONFIG.audio });

const game = new Phaser.Game({
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

game.registry.set('audio', audio);

// One-time unlock on first user gesture (browser policy).
const unlock = () => audio.unlock();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });
