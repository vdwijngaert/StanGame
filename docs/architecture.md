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
- **`src/entities/`** — Phaser Graphics wrappers. Each entity owns `this.graphics`, exposes `x`, `y`, and `destroy()`. `Player` additionally owns `this._numberText` (a separate Phaser Text object) that must always be moved/shown/hidden in sync with `this.graphics`.
- **`src/scenes/`** — Phaser Scene subclasses. `GameScene` owns the game loop: spawns entities, drives `DifficultyManager` and `ScoreManager`, checks collisions, manages lives and HUD.

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
| 5 | Player graphics + number text |
| 10 | HUD (hearts, score badge) |
| 15 | Virtual joystick (base ring + thumb nub) |
| 20 | Transient popups (GOAL, level-up) |
