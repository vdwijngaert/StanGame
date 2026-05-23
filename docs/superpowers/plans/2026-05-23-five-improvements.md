# Five Game Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Voeg 5 visuele en gameplay-verbeteringen toe aan de StanGame Phaser 3 endless runner zonder bestaande functionaliteit te breken.

**Architecture:** Elke taak raakt één of twee bestanden en kan onafhankelijk gecommit worden. Taak 1 (scale) moet eerst uitgevoerd worden omdat het `_draw()` refactort — de loopanimatie (taak 2) en bal bij voeten (taak 3) bouwen hierop voort. Taken 4 en 5 zijn volledig onafhankelijk.

**Tech Stack:** Phaser 3.87, Vite 6, Vitest 3 (tests alleen voor pure JS — geen Phaser entities). Verificatie van Phaser-entiteiten via `npm run dev` in browser.

---

## Bestandsoverzicht

| Bestand | Actie | Reden |
|---------|-------|-------|
| `src/config.js` | Modify | `scale: 1.75` aan player, shield config |
| `src/entities/Player.js` | Modify | Scale, loopanimatie, footBall, shield glow |
| `src/entities/Defender.js` | Modify | Scale, loopanimatie |
| `src/entities/Shield.js` | Create | Nieuwe collectible entity |
| `src/scenes/GameScene.js` | Modify | Collision radii, shield spawn/collect, level HUD, level popup |
| `src/systems/DifficultyManager.js` | Modify | `justLeveledUp` getter |
| `tests/systems/DifficultyManager.test.js` | Modify | Tests voor `justLeveledUp` |

---

## Task 1: Figuren groter (scale ×1.75)

Voegt `scale` toe aan config, past `Player` en `Defender` aan met `setScale()`, en update collision radii in GameScene. Refactort ook `Player._draw()` zodat het de `_numberText` **niet** meer aanmaakt (dat doet de constructor voortaan) — dit is verplicht voordat de loopanimatie in Taak 2 `_draw()` herhaaldelijk aanroept.

**Files:**
- Modify: `src/config.js`
- Modify: `src/entities/Player.js`
- Modify: `src/entities/Defender.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Stap 1: Voeg scale toe aan config.js**

Vervang het `player`-object in `src/config.js`:

```js
player: {
  name: 'Stan',
  number: 10,
  scale: 1.75,
  shirtColor: 0xFFD700,
  shirtColorHex: '#FFD700',
  shortsColor: 0x111111,
  sleeveColor: 0x111111,
  bootsColor: 0x222222,
  skinColor: 0xFFDAAB,
  club: 'KVV Duffel',
},
```

- [ ] **Stap 2: Refactor Player.js — tekst uit _draw(), scale toevoegen**

Vervang de volledige inhoud van `src/entities/Player.js`:

```js
// src/entities/Player.js
export class Player {
  constructor(scene, x, y, cfg) {
    this._scene = scene;
    this._cfg = cfg;
    this._invincible = false;
    this._flickerTimer = null;
    this._invincibleCallbackTimer = null;

    const scale = cfg.scale ?? 1;

    this.graphics = scene.add.graphics();
    this.graphics.setScale(scale);
    this.graphics.setDepth(5);

    this._numberText = scene.add.text(x, y, String(cfg.number), {
      fontSize: `${Math.round(10 * scale)}px`,
      fontFamily: 'Arial Black, sans-serif',
      color: '#111111',
    }).setOrigin(0.5, 0.5).setDepth(5);

    this.x = x;
    this.y = y;
    this._draw();
    this.graphics.setPosition(x, y);
    this._numberText.setPosition(x, y);
  }

  _draw() {
    const g = this.graphics;
    const { shirtColor, shortsColor, sleeveColor, bootsColor, skinColor } = this._cfg;
    g.clear();

    g.fillStyle(bootsColor);
    g.fillRect(-9, 22, 8, 6);
    g.fillRect(2, 22, 8, 6);

    g.fillStyle(shortsColor);
    g.fillRect(-11, 10, 22, 13);

    g.fillStyle(sleeveColor);
    g.fillRect(-18, -8, 8, 14);
    g.fillRect(10, -8, 8, 14);

    g.fillStyle(shirtColor);
    g.fillRect(-11, -10, 22, 22);

    g.fillStyle(skinColor);
    g.fillCircle(0, -20, 12);
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
    this.graphics.setPosition(x, y);
    this._numberText.setPosition(x, y);
  }

  startInvincibility(duration) {
    this._invincible = true;
    if (this._flickerTimer) this._flickerTimer.remove();
    if (this._invincibleCallbackTimer) this._invincibleCallbackTimer.remove();
    let visible = true;
    this._flickerTimer = this._scene.time.addEvent({
      delay: 120,
      repeat: Math.floor(duration / 120),
      callback: () => {
        visible = !visible;
        this.graphics.setVisible(visible);
        this._numberText.setVisible(visible);
      },
    });
    this._invincibleCallbackTimer = this._scene.time.delayedCall(duration, () => {
      if (this._flickerTimer) { this._flickerTimer.remove(); this._flickerTimer = null; }
      this._invincible = false;
      this.graphics.setVisible(true);
      this._numberText.setVisible(true);
    });
  }

  get isInvincible() { return this._invincible; }

  destroy() {
    this.graphics.destroy();
    this._numberText.destroy();
  }
}
```

- [ ] **Stap 3: Update Defender.js — scale parameter toevoegen**

Vervang de volledige inhoud van `src/entities/Defender.js`:

```js
// src/entities/Defender.js
export class Defender {
  constructor(scene, x, y, speed, scale = 1) {
    this._scene = scene;
    this.speed = speed;

    this.graphics = scene.add.graphics();
    this.graphics.setScale(scale);
    this.x = x;
    this.y = y;
    this._draw();
    this.graphics.setPosition(x, y);
  }

  _draw() {
    const g = this.graphics;
    g.clear();

    g.fillStyle(0x222222);
    g.fillRect(-9, 22, 8, 6);
    g.fillRect(2, 22, 8, 6);

    g.fillStyle(0x8b0000);
    g.fillRect(-11, 10, 22, 13);

    g.fillStyle(0xe74c3c);
    g.fillRect(-18, -8, 8, 14);
    g.fillRect(10, -8, 8, 14);
    g.fillRect(-11, -10, 22, 22);

    g.fillStyle(0xFFDAAB);
    g.fillCircle(0, -20, 12);
  }

  update(delta) {
    this.x -= this.speed * (delta / 1000);
    this.graphics.setPosition(this.x, this.y);
  }

  isOffScreen(leftBound) {
    return this.x < leftBound;
  }

  destroy() {
    this.graphics.destroy();
  }
}
```

- [ ] **Stap 4: Update GameScene — pass scale, update collision radii**

In `src/scenes/GameScene.js`, pas `_spawnDefender()` aan:

```js
_spawnDefender() {
  const { width, height } = this.scale;
  const y = Phaser.Math.Between(60, height - 60);
  this._defenders.push(
    new Defender(this, width + 30, y, this._difficulty.scrollSpeed * 0.9, CONFIG.player.scale)
  );
}
```

Pas `_checkCollisions()` aan:

```js
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
```

- [ ] **Stap 5: Verifieer in browser**

```bash
npm run dev
```

Open http://localhost:5173. Stan en de verdedigers zijn zichtbaar groter (×1.75). Rugnummer zit in het shirt. Botsen werkt nog correct.

- [ ] **Stap 6: Commit**

```bash
git add src/config.js src/entities/Player.js src/entities/Defender.js src/scenes/GameScene.js
git commit -m "feat: scale player and defenders ×1.75"
```

---

## Task 2: Loopanimatie (been-wip elke 200ms)

Voegt frame-gebaseerde animatie toe aan Player en Defender: elke 200ms wisselen de boots-posities (linkerbeen voor/achter). Bouwt voort op de `_draw()`-refactor uit Taak 1.

**Files:**
- Modify: `src/entities/Player.js`
- Modify: `src/entities/Defender.js`

- [ ] **Stap 1: Voeg frame-animatie toe aan Player._draw()**

Vervang de `_draw()`-methode en constructor in `src/entities/Player.js`. Voeg `this._frame = 0` en de animatietimer toe aan de constructor (na de bestaande setup), en pas `_draw()` aan:

Constructor — voeg toe na `this._draw(); this.graphics.setPosition(x, y); this._numberText.setPosition(x, y);`:

```js
this._animTimer = scene.time.addEvent({
  delay: 200,
  loop: true,
  callback: () => {
    this._frame ^= 1;
    this._draw(this._frame);
  },
});
```

Voeg `this._frame = 0;` toe als instance-variabele naast de andere in de constructor.

Vervang `_draw()` zodat het een `frame`-parameter accepteert:

```js
_draw(frame = 0) {
  const g = this.graphics;
  const { shirtColor, shortsColor, sleeveColor, bootsColor, skinColor } = this._cfg;
  g.clear();

  const leftBootY  = frame === 0 ? 20 : 24;
  const rightBootY = frame === 0 ? 24 : 20;
  g.fillStyle(bootsColor);
  g.fillRect(-9, leftBootY,  8, 6);
  g.fillRect( 2, rightBootY, 8, 6);

  g.fillStyle(shortsColor);
  g.fillRect(-11, 10, 22, 13);

  g.fillStyle(sleeveColor);
  g.fillRect(-18, -8, 8, 14);
  g.fillRect( 10, -8, 8, 14);

  g.fillStyle(shirtColor);
  g.fillRect(-11, -10, 22, 22);

  g.fillStyle(skinColor);
  g.fillCircle(0, -20, 12);
}
```

Voeg `this._animTimer` toe aan `destroy()`:

```js
destroy() {
  if (this._animTimer) this._animTimer.remove();
  this.graphics.destroy();
  this._numberText.destroy();
}
```

- [ ] **Stap 2: Voeg frame-animatie toe aan Defender**

Vervang de volledige inhoud van `src/entities/Defender.js`:

```js
// src/entities/Defender.js
export class Defender {
  constructor(scene, x, y, speed, scale = 1) {
    this._scene = scene;
    this.speed = speed;
    this._frame = 0;

    this.graphics = scene.add.graphics();
    this.graphics.setScale(scale);
    this.x = x;
    this.y = y;
    this._draw(0);
    this.graphics.setPosition(x, y);

    this._animTimer = scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        this._frame ^= 1;
        this._draw(this._frame);
      },
    });
  }

  _draw(frame = 0) {
    const g = this.graphics;
    g.clear();

    const leftBootY  = frame === 0 ? 20 : 24;
    const rightBootY = frame === 0 ? 24 : 20;
    g.fillStyle(0x222222);
    g.fillRect(-9, leftBootY,  8, 6);
    g.fillRect( 2, rightBootY, 8, 6);

    g.fillStyle(0x8b0000);
    g.fillRect(-11, 10, 22, 13);

    g.fillStyle(0xe74c3c);
    g.fillRect(-18, -8, 8, 14);
    g.fillRect( 10, -8, 8, 14);
    g.fillRect(-11, -10, 22, 22);

    g.fillStyle(0xFFDAAB);
    g.fillCircle(0, -20, 12);
  }

  update(delta) {
    this.x -= this.speed * (delta / 1000);
    this.graphics.setPosition(this.x, this.y);
  }

  isOffScreen(leftBound) {
    return this.x < leftBound;
  }

  destroy() {
    if (this._animTimer) this._animTimer.remove();
    this.graphics.destroy();
  }
}
```

- [ ] **Stap 3: Verifieer in browser**

```bash
npm run dev
```

Stan en de verdedigers bewegen hun benen afwisselend. Animatie stopt wanneer een entiteit vernietigd wordt.

- [ ] **Stap 4: Commit**

```bash
git add src/entities/Player.js src/entities/Defender.js
git commit -m "feat: add walk animation to player and defenders"
```

---

## Task 3: Bal bij Stan's voeten

Voegt een kleine witte cirkel toe die altijd naast Stan's voeten hangt en meebeweegt — de dribbelbal.

**Files:**
- Modify: `src/entities/Player.js`

- [ ] **Stap 1: Voeg _footBall toe aan Player**

In de constructor van Player, voeg toe na `this._animTimer = ...`:

```js
const scale = cfg.scale ?? 1;
this._footBall = scene.add.graphics();
this._footBall.fillStyle(0xffffff, 1);
this._footBall.fillCircle(0, 0, 5);
this._footBall.lineStyle(1, 0xcccccc, 1);
this._footBall.strokeCircle(0, 0, 5);
this._footBall.setDepth(4);
this._footBall.setPosition(x + 14 * scale, y + 20 * scale);
```

Update `moveTo()` zodat de bal meebeweegt:

```js
moveTo(x, y) {
  this.x = x;
  this.y = y;
  const scale = this._cfg.scale ?? 1;
  this.graphics.setPosition(x, y);
  this._numberText.setPosition(x, y);
  this._footBall.setPosition(x + 14 * scale, y + 20 * scale);
}
```

Update `startInvincibility()`: voeg `this._footBall` toe aan de visibility-toggle:

```js
startInvincibility(duration) {
  this._invincible = true;
  if (this._flickerTimer) this._flickerTimer.remove();
  if (this._invincibleCallbackTimer) this._invincibleCallbackTimer.remove();
  let visible = true;
  this._flickerTimer = this._scene.time.addEvent({
    delay: 120,
    repeat: Math.floor(duration / 120),
    callback: () => {
      visible = !visible;
      this.graphics.setVisible(visible);
      this._numberText.setVisible(visible);
      this._footBall.setVisible(visible);
    },
  });
  this._invincibleCallbackTimer = this._scene.time.delayedCall(duration, () => {
    if (this._flickerTimer) { this._flickerTimer.remove(); this._flickerTimer = null; }
    this._invincible = false;
    this.graphics.setVisible(true);
    this._numberText.setVisible(true);
    this._footBall.setVisible(true);
  });
}
```

Update `destroy()`:

```js
destroy() {
  if (this._animTimer) this._animTimer.remove();
  this.graphics.destroy();
  this._numberText.destroy();
  this._footBall.destroy();
}
```

- [ ] **Stap 2: Verifieer in browser**

```bash
npm run dev
```

Kleine witte cirkel zit rechtsonder aan Stan's voeten en beweegt mee met de pointer. Flikkert mee bij invincibility.

- [ ] **Stap 3: Commit**

```bash
git add src/entities/Player.js
git commit -m "feat: add dribble ball at player's feet"
```

---

## Task 4: Level-up popup + HUD level indicator

Toont een popup wanneer het level stijgt, en toont het huidige level continu in de HUD. De `justLeveledUp` getter op `DifficultyManager` is pure JS en wordt getest.

**Files:**
- Modify: `src/systems/DifficultyManager.js`
- Modify: `tests/systems/DifficultyManager.test.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Stap 1: Schrijf de falende test**

Voeg toe aan `tests/systems/DifficultyManager.test.js`:

```js
it('justLeveledUp is false initially', () => {
  expect(dm.justLeveledUp).toBe(false);
});

it('justLeveledUp is true immediately after level-up', () => {
  dm.update(30000);
  expect(dm.justLeveledUp).toBe(true);
});

it('justLeveledUp resets to false on next update', () => {
  dm.update(30000);
  dm.update(100);
  expect(dm.justLeveledUp).toBe(false);
});

it('justLeveledUp is false when no level-up occurs', () => {
  dm.update(1000);
  expect(dm.justLeveledUp).toBe(false);
});
```

- [ ] **Stap 2: Verifieer dat tests falen**

```bash
npx vitest run tests/systems/DifficultyManager.test.js
```

Verwacht: 4 failures met `dm.justLeveledUp is not a function` of `undefined`.

- [ ] **Stap 3: Implementeer justLeveledUp in DifficultyManager**

Vervang de volledige inhoud van `src/systems/DifficultyManager.js`:

```js
// src/systems/DifficultyManager.js
export class DifficultyManager {
  constructor(cfg) {
    this._cfg = cfg;
    this._elapsed = 0;
    this.level = 1;
    this.scrollSpeed = cfg.initialSpeed;
    this.spawnInterval = cfg.initialSpawnInterval;
    this._justLeveledUp = false;
  }

  update(deltaMs) {
    this._justLeveledUp = false;
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
      this._justLeveledUp = true;
    }
  }

  get justLeveledUp() { return this._justLeveledUp; }
}
```

- [ ] **Stap 4: Verifieer dat alle tests slagen**

```bash
npx vitest run tests/systems/DifficultyManager.test.js
```

Verwacht: alle tests PASS (inclusief de 5 bestaande).

- [ ] **Stap 5: Voeg HUD level-tekst en popup toe aan GameScene**

In `_buildHud()`, voeg toe na de hartjes-loop (na `this._heartTexts.push(t)`):

```js
this._levelText = this.add.text(18, 48, 'LVL 1', {
  fontSize: '16px',
  fontFamily: 'Arial Black, sans-serif',
  color: '#FFD700',
}).setScrollFactor(0).setDepth(10);
```

Voeg `_playLevelUpAnimation(level)` toe aan de klasse:

```js
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
```

In `update()`, voeg toe na `this._difficulty.update(delta)`:

```js
if (this._difficulty.justLeveledUp) {
  this._playLevelUpAnimation(this._difficulty.level);
}
```

En voeg toe na `this._scoreText.setText(...)`:

```js
this._levelText.setText('LVL ' + this._difficulty.level);
```

- [ ] **Stap 6: Verifieer in browser**

```bash
npm run dev
```

Na 30 seconden verschijnt "LEVEL 2! 🔥" in het midden en faded weg. De HUD toont "LVL 1" linksonder de hartjes en springt naar "LVL 2" op het juiste moment.

- [ ] **Stap 7: Commit**

```bash
git add src/systems/DifficultyManager.js tests/systems/DifficultyManager.test.js src/scenes/GameScene.js
git commit -m "feat: add level-up popup and HUD level indicator"
```

---

## Task 5: Schild-powerup

Voegt een blauw schild toe als collectible. Bij collecten: 3 seconden volledig onkwetsbaar met blauwe gloed rondom Stan.

**Files:**
- Create: `src/entities/Shield.js`
- Modify: `src/entities/Player.js`
- Modify: `src/scenes/GameScene.js`
- Modify: `src/config.js`

- [ ] **Stap 1: Voeg shield config toe aan config.js**

Voeg toe aan het CONFIG-object (na `invincibilityDuration`):

```js
shield: {
  spawnInterval: 8000,
  spawnChance: 0.35,
  duration: 3000,
},
```

- [ ] **Stap 2: Maak src/entities/Shield.js aan**

```js
// src/entities/Shield.js
export class Shield {
  constructor(scene, x, y, speed) {
    this._scene = scene;
    this.speed = speed;
    this.graphics = scene.add.graphics();
    this.x = x;
    this.y = y;
    this._draw();
    this.graphics.setPosition(x, y);
  }

  _draw() {
    const g = this.graphics;
    g.clear();
    // Shield body
    g.fillStyle(0x3b82f6);
    g.fillRect(-11, -14, 22, 18);
    // Bottom point
    g.fillTriangle(-11, 4, 11, 4, 0, 16);
    // Border
    g.lineStyle(2, 0x93c5fd, 1);
    g.strokeRect(-11, -14, 22, 18);
    // Tick mark
    g.lineStyle(2.5, 0xffffff, 1);
    g.lineBetween(-5, -2, -1, 4);
    g.lineBetween(-1, 4, 7, -5);
  }

  update(delta) {
    this.x -= this.speed * (delta / 1000);
    this.graphics.setPosition(this.x, this.y);
  }

  isOffScreen(leftBound) {
    return this.x < leftBound;
  }

  destroy() {
    this.graphics.destroy();
  }
}
```

- [ ] **Stap 3: Voeg startShield toe aan Player.js**

Voeg de methode toe aan de Player-klasse:

```js
startShield(duration) {
  if (this._shieldGlow) { this._shieldGlow.destroy(); this._shieldGlow = null; }
  const scale = this._cfg.scale ?? 1;
  this._shieldGlow = this._scene.add.graphics();
  this._shieldGlow.fillStyle(0x3b82f6, 0.3);
  this._shieldGlow.fillCircle(0, 0, 38 * scale);
  this._shieldGlow.lineStyle(3, 0x60a5fa, 0.9);
  this._shieldGlow.strokeCircle(0, 0, 38 * scale);
  this._shieldGlow.setPosition(this.x, this.y);
  this._shieldGlow.setDepth(4);

  this.startInvincibility(duration);

  this._scene.time.delayedCall(duration, () => {
    if (this._shieldGlow) { this._shieldGlow.destroy(); this._shieldGlow = null; }
  });
}
```

Update `moveTo()` — voeg toe na `this._footBall.setPosition(...)`:

```js
if (this._shieldGlow) this._shieldGlow.setPosition(x, y);
```

Update `destroy()`:

```js
destroy() {
  if (this._animTimer) this._animTimer.remove();
  if (this._shieldGlow) this._shieldGlow.destroy();
  this.graphics.destroy();
  this._numberText.destroy();
  this._footBall.destroy();
}
```

- [ ] **Stap 4: Integreer Shield in GameScene.js**

Voeg de import toe bovenaan:

```js
import { Shield } from '../entities/Shield.js';
```

In `create()`, voeg toe na `this._ballTimer = 0;`:

```js
this._shields = [];
this._shieldTimer = 0;
```

In `_updateSpawns()`, voeg toe na de ballTimer-check:

```js
this._shieldTimer += delta;
if (this._shieldTimer >= CONFIG.shield.spawnInterval) {
  this._shieldTimer = 0;
  if (Math.random() < CONFIG.shield.spawnChance) this._spawnShield();
}
```

Voeg de spawn-methode toe:

```js
_spawnShield() {
  const { width, height } = this.scale;
  const y = Phaser.Math.Between(80, height - 80);
  this._shields.push(new Shield(this, width + 30, y, this._difficulty.scrollSpeed * 0.7));
}
```

In `_updateEntities()`, voeg toe na de balls-filter:

```js
for (const sh of this._shields) sh.update(delta);
this._shields = this._shields.filter(sh => {
  if (sh.isOffScreen(-30)) { sh.destroy(); return false; }
  return true;
});
```

In `_checkCollisions()`, voeg toe na de balls-loop (voor de sluitende `}`). Let op: `s` is al gedeclareerd door Task 1 — niet opnieuw declareren:

```js
for (let i = this._shields.length - 1; i >= 0; i--) {
  const sh = this._shields[i];
  if (Phaser.Math.Distance.Between(px, py, sh.x, sh.y) < 24 * s) {
    this._player.startShield(CONFIG.shield.duration);
    sh.destroy();
    this._shields.splice(i, 1);
    break;
  }
}
```

- [ ] **Stap 5: Verifieer in browser**

```bash
npm run dev
```

Na ~8 seconden verschijnt soms een blauw schildicoon. Bij collecten: blauwe gloed rondom Stan, 3 seconden onkwetsbaar (verdedigers botsen niet). Gloed verdwijnt daarna.

- [ ] **Stap 6: Run alle tests**

```bash
npm test
```

Verwacht: alle 13 bestaande tests + 4 nieuwe DifficultyManager-tests = 17 tests PASS.

- [ ] **Stap 7: Commit**

```bash
git add src/entities/Shield.js src/entities/Player.js src/scenes/GameScene.js src/config.js
git commit -m "feat: add shield power-up with blue glow"
```
