# Design: 5 verbeteringen StanGame

Date: 2026-05-23

## Overzicht

Vijf onafhankelijke verbeteringen aan de bestaande Phaser 3 endless runner. Elke verbetering raakt één of meerdere files maar heeft geen onderlinge afhankelijkheden — ze kunnen parallel geïmplementeerd worden.

---

## 1. Bal bij Stan's voeten

**Wat:** Een kleine witte cirkel (r=5) die altijd meereist op offset (+14, +20) van Stan's positie. Zichtbaar als dribbelbal.

**Waar:** `Player.js`

- Voeg `this._footBall = scene.add.graphics()` toe in de constructor, teken er een witte cirkel op.
- Stel depth in op 4 (onder Stan zelf).
- In `moveTo()`: update positie mee als `(x + 14 * scale, y + 20 * scale)` zodat de offset mee schaalt met de figuurgrootte.
- In `startInvincibility()`: de flicker-timer toont/verbergt ook `_footBall`.
- In `destroy()`: `_footBall.destroy()`.

---

## 2. Figuren groter (×1.75)

**Wat:** Stan en verdedigers zijn op dit moment klein. Schaal ×1.75 maakt ze beter zichtbaar op mobiel.

**Waar:** `config.js`, `Player.js`, `Defender.js`, `GameScene.js`

- Voeg `scale: 1.75` toe aan `CONFIG.player` zodat het automatisch meegaat via de bestaande `cfg`-parameter in Player en Defender.
- In `Player` constructor: `this.graphics.setScale(cfg.scale ?? 1)`.
- In `Defender` constructor: idem, maar Defender krijgt momenteel geen `cfg` — voeg een `cfg`-parameter toe (of pass gewoon de scale direct als getal).
- In `GameScene._checkCollisions()`: vermenigvuldig collision radii met `CONFIG.player.scale` (34 × 1.75 ≈ 60 px voor verdedigers, 28 × 1.75 ≈ 49 px voor ballen, 24 × 1.75 ≈ 42 px voor schild).
- `_numberText` y-offset en fontSize schalen mee: positie `y - 2 * scale` → `y - 3.5`, fontSize `'${Math.round(10 * scale)}px'` → `'18px'`.

---

## 3. Loopanimatie (been-wip)

**Wat:** Stan en verdedigers wisselen elke 200ms tussen twee frames: linkerbeen voor vs. rechterbeen voor.

**Waar:** `Player.js`, `Defender.js`

- Voeg `_frame = 0` toe als instance-variabele.
- Pas `_draw()` aan: accepteer een `frame` parameter (0 of 1). De bestaande boots zitten op y=22 (beide). In frame 0: linkerboot op y=20 (naar voren), rechterboot op y=24 (naar achteren). In frame 1: omgekeerd. Alleen de boots-rects wisselen; de rest van `_draw()` blijft ongewijzigd.
- Start in constructor een `scene.time.addEvent({ delay: 200, loop: true, callback: () => { this._frame ^= 1; this._draw(this._frame); } })`.
- Sla de timer op als `this._animTimer` en verwijder hem in `destroy()`.
- Zelfde implementatie in `Defender`.

---

## 4. Level-up popup

**Wat:** Wanneer `DifficultyManager` een level omhoog gaat, verschijnt kort een popup "LEVEL 2! 🔥" in het midden van het scherm — zelfde tween-patroon als de bestaande `_playGoalAnimation()`.

**Waar:** `GameScene.js`, `DifficultyManager.js`

- Voeg een getter `get justLeveledUp()` toe aan `DifficultyManager` die `true` retourneert op de eerste `update()`-aanroep na een level-stap, daarna reset naar `false`.
- In `GameScene.update()`: check `if (this._difficulty.justLeveledUp) this._playLevelUpAnimation(this._difficulty.level)`.
- Implementeer `_playLevelUpAnimation(level)` analoog aan `_playGoalAnimation()`: tekst `"LEVEL ${level}! 🔥"`, goudgeel, depth 20, tween omhoog + fade-out in 1400ms.

---

## 5. Schild-powerup

**Wat:** Een blauw schildicoon scrollt als collectible van rechts naar links. Bij collecten: Stan is 3s volledig onkwetsbaar + blauwe gloed.

**Waar:** nieuw `src/entities/Shield.js`, `GameScene.js`, `config.js`

### Shield.js
- Zelfde structuur als `Ball.js`: constructor, `_draw()`, `update(delta)`, `isOffScreen(leftBound)`, `destroy()`.
- `_draw()`: teken een blauw schild-silhouet met Phaser Graphics (gevuld polygon of circle + vlak met kleur `0x3b82f6`, rand `0x60a5fa`).

### GameScene
- Voeg `this._shields = []` toe naast `_balls`.
- Spawn-logica: eigen timer `_shieldTimer`, interval 8000ms, kans 35%. Snelheid gelijk aan `scrollSpeed * 0.7`.
- In `_checkCollisions()`: bij raak (radius 24 px × entityScale) → `player.startShield(3000)`.
- In `_updateEntities()`: update en filter shields net als balls.

### Player — shield-visueel
- Voeg `startShield(duration)` toe: zet `this._shielded = true`, teken een blauwe gloed-cirkel (`this._shieldGlow`) rond Stan (r=30, alpha 0.5, color `0x3b82f6`, depth 4).
- `startShield` roept intern `startInvincibility(duration)` aan voor de bestaande logica.
- Na afloop (in de delayedCall callback): verwijder `_shieldGlow`, zet `_shielded = false`.
- `isInvincible` blijft de collision-gate — geen aparte check nodig.

### config.js
- Voeg toe: `shieldSpawnInterval: 8000`, `shieldSpawnChance: 0.35`, `shieldDuration: 3000`.

---

## Niet in scope

- Geluid/muziek
- Nieuwe scènes
- Wijzigingen aan scoring of moeilijkheidsgraad
- Persistentie buiten de bestaande localStorage high score
