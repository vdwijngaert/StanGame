# Architecture

**Stan Dribble Runner** — Phaser 3 + Vite endless runner (480×854 portrait). Stan (KVV Duffel #10) dodges red defenders and collects golden balls. All visuals are drawn with Phaser Graphics primitives; there are no image assets.

## Scene flow

```
BootScene → BirthdayScene (if CONFIG.birthday.show) → GameScene → GameOverScene
```

Data passes between scenes via `this.scene.start('Name', { score, highScore, isNewRecord })`. `GameOverScene.init()` receives this payload.

## Layers

- **`src/config.js`** — single source of truth for all personalization (colors, numbers, speed, scoring). Change here first.
- **`src/systems/`** — pure JS classes with no Phaser dependency. Testable in Node via Vitest. Includes `DifficultyManager`, `ScoreManager`, `VirtualJoystick` (input state machine), and the `applyVelocity` helper in `movement.js`.
- **`src/entities/`** — Phaser Graphics wrappers. Each entity owns `this.graphics`, exposes `x`, `y`, and `destroy()`. Most entities also own ancillary Graphics objects (drop shadow, halo) that must be moved/shown/hidden in sync with `this.graphics`. `Player` additionally owns `this._numberText` (a separate Phaser Text object) with the same constraint.
- **`src/scenes/`** — Phaser Scene subclasses. `GameScene` owns the game loop: spawns entities, drives `DifficultyManager` and `ScoreManager`, checks collisions, manages lives and HUD.
- **`src/scenes/visuals.js`** — Phaser-coupled visual helpers shared across scenes: `drawRoundedGradientPanel` (glassmorphism panel with vertical-strip gradient + rounded border), `spawnBurst` (radial particle burst), `spawnRing` (expanding outline ring). Not unit-tested.

## Key GameScene patterns

- Pitch scrolls by moving stripe rectangles left and wrapping: each stripe shifts back by `NUM_STRIPES * STRIPE_WIDTH` when it exits left.
- Collision uses `Phaser.Math.Distance.Between` with hardcoded radii (34 px for defenders, 28 px for balls).
- After a hit, `Player.startInvincibility()` sets a flicker timer; `_checkCollisions` is gated on `player.isInvincible`.
- `DifficultyManager.level` is read-only from outside.
- High score persists in `localStorage` under key `stan_runner_highscore`.
- Player movement is velocity-based: `GameScene._inputVector()` returns the joystick vector (or normalized arrow-key vector when the joystick is inactive); `Player.setVelocity` + `Player.update(delta)` integrates and clamps to bounds set in `create()`.

## Depth layers

| Depth | Content |
|-------|---------|
| 0 (default) | Pitch stripes |
| 1 | Static field sidelines (white) |
| 2 | Floodlight ellipse (tracks player) |
| 3 | Corner vignette overlay |
| 4 | Entity drop shadows, ball/shield halos, player shield glow, foot ball |
| 5 | Player + Defender graphics + number text |
| 9 | HUD panel backgrounds (rounded gradient), score shadow text, heart halos |
| 10 | HUD text (hearts, level, score) |
| 15 | Virtual joystick (base ring + thumb nub) |
| 20 | Transient popups (GOAL, level-up, +N, particle bursts, expanding rings) |

## Rendering notes

- The internal canvas is fixed at 480×854 and CSS-scaled to fit the viewport via `Phaser.Scale.FIT`. On high-DPI displays this means some upscaling blur. The legacy Phaser `resolution` config option was removed in 3.50 and is silently ignored — a real fix requires bumping the design resolution and scaling all coordinates, which has not been done.
- Phaser `Graphics.fillGradientStyle(tl, tr, bl, br, [aTL, aTR, aBL, aBR])` works on rectangles and triangles but **not** on rounded rectangles or circles — for rounded gradient panels we stack thin horizontal `fillRect` strips with interpolated colors (see `drawRoundedGradientPanel`).
