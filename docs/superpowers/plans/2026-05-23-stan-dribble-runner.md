# Stan Dribble Runner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-friendly Phaser 3 endless runner where Stan dribbles past defenders on a KVV Duffel pitch, as a personalized 10th birthday gift.

**Architecture:** Four Phaser scenes (Boot → Birthday → Game → GameOver). All visuals drawn procedurally with Phaser Graphics — no image files needed. Pure-logic systems (DifficultyManager, ScoreManager) are plain JS classes kept outside Phaser so they can be unit-tested with Vitest.

**Tech Stack:** Phaser 3, Vite, Vitest, Vanilla JS (ESM)

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | Dependencies + npm scripts |
| `index.html` | Entry point, viewport meta |
| `vite.config.js` | Vite + Vitest config |
| `src/config.js` | All personalization (name, colors, number) |
| `src/main.js` | Phaser game instance + scene registry |
| `src/scenes/BootScene.js` | Transition to Birthday/Game |
| `src/scenes/BirthdayScene.js` | Splash screen with birthday message |
| `src/scenes/GameScene.js` | Orchestrates gameplay |
| `src/scenes/GameOverScene.js` | Final score + high score + replay |
| `src/entities/Player.js` | Stan — drawing, pointer following, flicker |
| `src/entities/Defender.js` | Red defender — drawing, leftward movement |
| `src/entities/Ball.js` | Golden ball collectible — drawing, movement |
| `src/systems/DifficultyManager.js` | Level progression every 30s |
| `src/systems/ScoreManager.js` | Score tracking + localStorage high score |
| `tests/systems/DifficultyManager.test.js` | Unit tests for level logic |
| `tests/systems/ScoreManager.test.js` | Unit tests for score + high score |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "stan-game",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "phaser": "^3.87.0"
  },
  "devDependencies": {
    "vite": "^6.3.5",
    "vitest": "^3.1.4"
  }
}
```

- [ ] **Step 2: Create index.html**

```html
<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>Stan Dribble Runner</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #111; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
    </style>
  </head>
  <body>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 3: Create vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 4: Update .gitignore**

Add to `.gitignore`:
```
node_modules/
dist/
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json index.html vite.config.js .gitignore package-lock.json
git commit -m "chore: scaffold Phaser 3 + Vite project"
```

---

## Task 2: Config

**Files:**
- Create: `src/config.js`

- [ ] **Step 1: Create src/config.js**

```js
export const CONFIG = {
  player: {
    name: 'Stan',
    number: 10,
    shirtColor: 0xFFD700,     // Phaser uses hex integers, not strings
    shirtColorHex: '#FFD700', // for CSS / text rendering
    shortsColor: 0x111111,
    sleeveColor: 0x111111,
    bootsColor: 0x222222,
    skinColor: 0xFFDAAB,
    club: 'KVV Duffel',
  },
  birthday: {
    show: true,
    age: 10,
    message: 'Gelukkige verjaardag Stan! 🎂',
  },
  difficulty: {
    levelUpInterval: 30000,   // ms between level increases
    initialSpeed: 200,        // px/s world scroll speed
    speedIncrement: 30,       // px/s per level
    initialSpawnInterval: 2200, // ms between defender spawns
    spawnIntervalDecrement: 150, // ms reduction per level
    minSpawnInterval: 600,
  },
  scoring: {
    distancePerPoint: 5,      // px scrolled = 1 score point
    ballBonus: 10,
    goalBonus: 100,
    goalInterval: 500,        // score points between goals
  },
  lives: 3,
  invincibilityDuration: 2000, // ms after being hit
};
```

- [ ] **Step 2: Commit**

```bash
git add src/config.js
git commit -m "feat: add personalization config"
```

---

## Task 3: DifficultyManager (with tests)

**Files:**
- Create: `src/systems/DifficultyManager.js`
- Create: `tests/systems/DifficultyManager.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/systems/DifficultyManager.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { DifficultyManager } from '../../src/systems/DifficultyManager.js';

const cfg = {
  levelUpInterval: 30000,
  initialSpeed: 200,
  speedIncrement: 30,
  initialSpawnInterval: 2200,
  spawnIntervalDecrement: 150,
  minSpawnInterval: 600,
};

describe('DifficultyManager', () => {
  let dm;
  beforeEach(() => { dm = new DifficultyManager(cfg); });

  it('starts at level 1 with initial speed', () => {
    expect(dm.level).toBe(1);
    expect(dm.scrollSpeed).toBe(200);
    expect(dm.spawnInterval).toBe(2200);
  });

  it('advances level after levelUpInterval ms', () => {
    dm.update(30000);
    expect(dm.level).toBe(2);
    expect(dm.scrollSpeed).toBe(230);
    expect(dm.spawnInterval).toBe(2050);
  });

  it('does not go below minSpawnInterval', () => {
    for (let i = 0; i < 20; i++) dm.update(30000);
    expect(dm.spawnInterval).toBeGreaterThanOrEqual(600);
  });

  it('partial time does not advance level', () => {
    dm.update(15000);
    expect(dm.level).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- tests/systems/DifficultyManager.test.js
```

Expected: `Cannot find module '../../src/systems/DifficultyManager.js'`

- [ ] **Step 3: Implement DifficultyManager**

```js
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- tests/systems/DifficultyManager.test.js
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add src/systems/DifficultyManager.js tests/systems/DifficultyManager.test.js
git commit -m "feat: add DifficultyManager with tests"
```

---

## Task 4: ScoreManager (with tests)

**Files:**
- Create: `src/systems/ScoreManager.js`
- Create: `tests/systems/ScoreManager.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/systems/ScoreManager.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '../../src/systems/ScoreManager.js';

const cfg = { distancePerPoint: 5, ballBonus: 10, goalBonus: 100, goalInterval: 500 };

describe('ScoreManager', () => {
  let sm;
  beforeEach(() => {
    // Isolate localStorage between tests
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v); },
    });
    sm = new ScoreManager(cfg);
  });

  it('starts at zero', () => {
    expect(sm.score).toBe(0);
  });

  it('adds distance points', () => {
    sm.addDistance(15); // 15px / 5 = 3 points
    expect(sm.score).toBe(3);
  });

  it('adds ball bonus', () => {
    sm.collectBall();
    expect(sm.score).toBe(10);
  });

  it('detects goal milestone and adds bonus', () => {
    sm.addDistance(2500); // 500 points
    expect(sm.checkGoal()).toBe(true);
    expect(sm.score).toBe(600); // 500 + 100
  });

  it('does not trigger same goal milestone twice', () => {
    sm.addDistance(2500);
    sm.checkGoal();
    expect(sm.checkGoal()).toBe(false);
  });

  it('saves and reads high score from localStorage', () => {
    sm.addDistance(500);
    sm.saveHighScore();
    const sm2 = new ScoreManager(cfg);
    expect(sm2.highScore).toBe(100);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- tests/systems/ScoreManager.test.js
```

Expected: `Cannot find module '../../src/systems/ScoreManager.js'`

- [ ] **Step 3: Implement ScoreManager**

```js
// src/systems/ScoreManager.js
const LS_KEY = 'stan_runner_highscore';

export class ScoreManager {
  constructor(cfg) {
    this._cfg = cfg;
    this.score = 0;
    this._distancePx = 0;
    this._lastGoalAt = 0;
    this.highScore = parseInt(localStorage.getItem(LS_KEY) ?? '0', 10);
  }

  addDistance(px) {
    this._distancePx += px;
    this.score = Math.floor(this._distancePx / this._cfg.distancePerPoint);
  }

  collectBall() {
    this.score += this._cfg.ballBonus;
  }

  checkGoal() {
    const milestone = Math.floor(this.score / this._cfg.goalInterval);
    const lastMilestone = Math.floor(this._lastGoalAt / this._cfg.goalInterval);
    if (milestone > lastMilestone) {
      this._lastGoalAt = this.score;
      this.score += this._cfg.goalBonus;
      return true;
    }
    return false;
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(LS_KEY, this.score);
    }
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- tests/systems/ScoreManager.test.js
```

Expected: `6 passed`

- [ ] **Step 5: Commit**

```bash
git add src/systems/ScoreManager.js tests/systems/ScoreManager.test.js
git commit -m "feat: add ScoreManager with tests"
```

---

## Task 5: Player Entity

**Files:**
- Create: `src/entities/Player.js`

- [ ] **Step 1: Create Player.js**

```js
// src/entities/Player.js
export class Player {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} cfg  - CONFIG.player
   */
  constructor(scene, x, y, cfg) {
    this._scene = scene;
    this._cfg = cfg;
    this._invincible = false;
    this._flickerTimer = null;

    this.graphics = scene.add.graphics();
    this.x = x;
    this.y = y;
    this._draw();
  }

  _draw() {
    const g = this.graphics;
    const { shirtColor, shortsColor, sleeveColor, bootsColor, skinColor, number } = this._cfg;
    g.clear();

    // Boots
    g.fillStyle(bootsColor);
    g.fillRect(-9, 22, 8, 6);
    g.fillRect(2, 22, 8, 6);

    // Shorts
    g.fillStyle(shortsColor);
    g.fillRect(-11, 10, 22, 13);

    // Sleeves
    g.fillStyle(sleeveColor);
    g.fillRect(-18, -8, 8, 14);
    g.fillRect(10, -8, 8, 14);

    // Shirt body
    g.fillStyle(shirtColor);
    g.fillRect(-11, -10, 22, 22);

    // Jersey number
    const text = this._scene.add.text(0, -2, String(number), {
      fontSize: '10px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#111111',
    }).setOrigin(0.5, 0.5);
    this._numberText = text;

    // Head
    g.fillStyle(skinColor);
    g.fillCircle(0, -20, 12);
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
    this.graphics.setPosition(x, y);
    if (this._numberText) this._numberText.setPosition(x, y - 2);
    this.body.setPosition(x, y);
  }

  startInvincibility(duration) {
    this._invincible = true;
    if (this._flickerTimer) this._flickerTimer.remove();
    let visible = true;
    this._flickerTimer = this._scene.time.addEvent({
      delay: 120,
      repeat: Math.floor(duration / 120),
      callback: () => {
        visible = !visible;
        this.graphics.setVisible(visible);
        if (this._numberText) this._numberText.setVisible(visible);
      },
    });
    this._scene.time.delayedCall(duration, () => {
      this._invincible = false;
      this.graphics.setVisible(true);
      if (this._numberText) this._numberText.setVisible(true);
    });
  }

  get isInvincible() { return this._invincible; }

  destroy() {
    this.graphics.destroy();
    if (this._numberText) this._numberText.destroy();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/entities/Player.js
git commit -m "feat: add Player entity"
```

---

## Task 6: Defender Entity

**Files:**
- Create: `src/entities/Defender.js`

- [ ] **Step 1: Create Defender.js**

```js
// src/entities/Defender.js
export class Defender {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {number} speed  px/s
   */
  constructor(scene, x, y, speed) {
    this._scene = scene;
    this.speed = speed;

    this.graphics = scene.add.graphics();
    this.x = x;
    this.y = y;
    this._draw();
  }

  _draw() {
    const g = this.graphics;
    g.clear();

    // Boots
    g.fillStyle(0x222222);
    g.fillRect(-9, 22, 8, 6);
    g.fillRect(2, 22, 8, 6);

    // Shorts
    g.fillStyle(0x8b0000);
    g.fillRect(-11, 10, 22, 13);

    // Shirt
    g.fillStyle(0xe74c3c);
    g.fillRect(-18, -8, 8, 14);  // left sleeve
    g.fillRect(10, -8, 8, 14);   // right sleeve
    g.fillRect(-11, -10, 22, 22); // body

    // Head
    g.fillStyle(0xFFDAAB);
    g.fillCircle(0, -20, 12);
  }

  update(delta) {
    this.x -= this.speed * (delta / 1000);
    this.graphics.setPosition(this.x, this.y);
  }

  isOffScreen(leftBound) {
    return this.x < leftBound - 50;
  }

  destroy() {
    this.graphics.destroy();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/entities/Defender.js
git commit -m "feat: add Defender entity"
```

---

## Task 7: Ball Collectible Entity

**Files:**
- Create: `src/entities/Ball.js`

- [ ] **Step 1: Create Ball.js**

```js
// src/entities/Ball.js
export class Ball {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {number} speed  px/s
   */
  constructor(scene, x, y, speed) {
    this._scene = scene;
    this.speed = speed;

    this.graphics = scene.add.graphics();
    this.x = x;
    this.y = y;
    this._draw();
  }

  _draw() {
    const g = this.graphics;
    g.clear();
    // White ball
    g.fillStyle(0xFFFFFF);
    g.fillCircle(0, 0, 12);
    // Black pentagon patches (simplified: 5 small dots)
    g.fillStyle(0x111111);
    g.fillCircle(0, 0, 3);
    g.fillCircle(0, -7, 2.5);
    g.fillCircle(6, 4, 2.5);
    g.fillCircle(-6, 4, 2.5);
    // Gold glow outline
    g.lineStyle(2, 0xFFD700, 1);
    g.strokeCircle(0, 0, 12);
  }

  update(delta) {
    this.x -= this.speed * (delta / 1000);
    this.graphics.setPosition(this.x, this.y);
  }

  isOffScreen(leftBound) {
    return this.x < leftBound - 30;
  }

  destroy() {
    this.graphics.destroy();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/entities/Ball.js
git commit -m "feat: add Ball collectible entity"
```

---

## Task 8: BootScene + BirthdayScene

**Files:**
- Create: `src/scenes/BootScene.js`
- Create: `src/scenes/BirthdayScene.js`

- [ ] **Step 1: Create BootScene.js**

```js
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
```

- [ ] **Step 2: Create BirthdayScene.js**

```js
// src/scenes/BirthdayScene.js
import Phaser from 'phaser';
import { CONFIG } from '../config.js';

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
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.js src/scenes/BirthdayScene.js
git commit -m "feat: add Boot and Birthday scenes"
```

---

## Task 9: Main Entry + Phaser Setup

**Files:**
- Create: `src/main.js`

- [ ] **Step 1: Create src/main.js**

```js
// src/main.js
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { BirthdayScene } from './scenes/BirthdayScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 480,
  height: 854,
  backgroundColor: '#111111',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, BirthdayScene, GameScene, GameOverScene],
});
```

- [ ] **Step 2: Smoke test in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected: birthday splash on yellow background with "Gelukkige verjaardag Stan! 🎂" and a "Spelen!" button. Clicking the button should transition (and crash because GameScene doesn't exist yet — that's fine).

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: wire Phaser game with all scenes"
```

---

## Task 10: GameScene — Pitch Background

**Files:**
- Create: `src/scenes/GameScene.js` (initial, pitch only)

- [ ] **Step 1: Create GameScene.js with scrolling pitch**

```js
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
    this._scrollPitch(delta);
    this._difficulty.update(delta);
    this._updateSpawns(delta);
    this._updateEntities(delta);
    this._checkCollisions();
    this._score.addDistance(this._difficulty.scrollSpeed * (delta / 1000));
    if (this._score.checkGoal()) this._playGoalAnimation();
    this._scoreText.setText(this._score.score + 'm');
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
    this._defenders.push(new Defender(this, width + 30, y, this._difficulty.scrollSpeed * 0.9));
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

    for (const d of this._defenders) {
      if (Phaser.Math.Distance.Between(px, py, d.x, d.y) < 34) {
        this._loseLife();
        return;
      }
    }

    for (let i = this._balls.length - 1; i >= 0; i--) {
      const b = this._balls[i];
      if (Phaser.Math.Distance.Between(px, py, b.x, b.y) < 28) {
        this._score.collectBall();
        b.destroy();
        this._balls.splice(i, 1);
      }
    }
  }

  _loseLife() {
    this._lives--;
    this._player.startInvincibility(CONFIG.invincibilityDuration);
    if (this._lives <= 0) {
      this._score.saveHighScore();
      this.time.delayedCall(600, () => {
        this.scene.start('GameOverScene', {
          score: this._score.score,
          highScore: this._score.highScore,
        });
      });
    }
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
}
```

- [ ] **Step 2: Test in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Click "Spelen!". Expected:
- Scrolling green striped pitch ✓
- Stan (yellow shirt, black shorts, number 10) visible ✓
- Stan follows your mouse/touch when clicking/dragging ✓
- Red defenders scroll in from the right ✓
- White balls appear and scroll in ✓
- Hearts in top-left ✓
- Score counter in top-right ✓
- Losing all lives crashes (GameOverScene missing — expected) ✓

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: add GameScene with pitch, player, defenders, scoring, HUD"
```

---

## Task 11: GameOverScene

**Files:**
- Create: `src/scenes/GameOverScene.js`

- [ ] **Step 1: Create GameOverScene.js**

```js
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
    const isNew = this._score >= this._highScore;
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
```

- [ ] **Step 2: Full end-to-end test in browser**

```bash
npm run dev
```

Play through the full game:
- Birthday splash shows ✓
- Tap "Spelen!" → game starts ✓
- Take 3 hits from defenders → GameOverScene shows ✓
- Score and high score visible ✓
- "Opnieuw" restarts the game ✓
- Balls collected add +10 to score ✓
- Goal animation fires every 500m ✓

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameOverScene.js
git commit -m "feat: add GameOverScene with score, high score, and replay"
```

---

## Task 12: Mobile Polish

**Files:**
- Modify: `index.html`
- Modify: `src/main.js`

- [ ] **Step 1: Prevent scroll/zoom on mobile in index.html**

Replace the `<style>` block in `index.html`:

```html
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #111;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    overflow: hidden;
    touch-action: none;
  }
  canvas { display: block; }
</style>
```

- [ ] **Step 2: Verify on mobile viewport in browser DevTools**

Open DevTools → toggle device toolbar → select iPhone SE (375×667).
Expected: game fills screen without scrollbars, touch drag moves Stan.

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Final commit**

```bash
git add index.html
git commit -m "fix: prevent mobile scroll and zoom on canvas"
```

---

## Task 13: Build & Share

**Files:** none (output only)

- [ ] **Step 1: Production build**

```bash
npm run build
```

Expected: `dist/` folder created with `index.html` and assets.

- [ ] **Step 2: Smoke-test the build**

```bash
npm run preview
```

Open the printed URL. Play through the full game once to verify the production build works identically to dev.

- [ ] **Step 3: Commit dist (optional) or deploy**

To share via GitHub Pages, either:
- Push `dist/` contents to a `gh-pages` branch, or
- Add `base: '/StanGame/'` to `vite.config.js` and push the whole repo; enable GitHub Pages from Settings → Pages → `dist/` folder.

Simplest for a birthday gift: open `dist/index.html` directly in a browser on Stan's device, or host with `npx serve dist`.
