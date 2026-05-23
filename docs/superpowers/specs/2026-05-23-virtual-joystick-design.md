# Virtual joystick controls — design

**Date:** 2026-05-23
**Status:** design

## Goal

Replace the current "touch-to-snap" control scheme with a floating, analog virtual joystick. The player should move at a velocity proportional to the joystick deflection, in any direction, while staying inside the visible pitch (clear of the HUD).

## Why

Touch-to-snap teleports the player wherever you touch, which feels jerky and rewards tap-spamming over reading the field. A floating analog stick gives Stan smooth, expressive control and matches what he already knows from other mobile games.

## Current behavior (to be removed)

- `GameScene.create()` registers `pointermove` and `pointerdown` handlers that call `player.moveTo(x, y)` directly.
- `Player.moveTo(x, y)` does an instant set of `x`/`y` and re-positions all child graphics (`graphics`, `_numberText`, `_footBall`, `_shieldGlow`).
- No velocity, no bounds, no keyboard input.

## New behavior

- A floating virtual joystick appears wherever the player first touches and follows the thumb until release.
- The joystick vector drives the player at up to `playerMaxSpeed` (350 px/s) in any direction.
- The player is clamped to a rectangle that covers the pitch but excludes the HUD strip at the top.
- Arrow keys on desktop act as a fallback when the joystick is inactive.
- The previous touch-to-snap listeners are removed.

## Components

### `src/systems/VirtualJoystick.js` (new)

Pure JS — unit-testable in Node.

Constructor config: `{ baseRadius, thumbMaxRadius, deadzone }`.

State:
- `active: boolean`
- `pointerId: number | null` — the pointer currently driving the stick (first one wins)
- `baseX, baseY` — where the touch started
- `thumbX, thumbY` — current thumb position (clamped within `thumbMaxRadius` of the base)

Methods:
- `onPointerDown(pointerId, x, y)` — if inactive, activate and anchor base+thumb at `(x, y)`. If already active, ignore.
- `onPointerMove(pointerId, x, y)` — if `pointerId` matches, update `thumbX/Y`, clamping the offset to `thumbMaxRadius`.
- `onPointerUp(pointerId)` — if `pointerId` matches, deactivate and reset state.

Getter:
- `vector` → `{ x, y, magnitude }`
  - `x, y` are in `[-1, 1]` (offset divided by `thumbMaxRadius`).
  - `magnitude` is in `[0, 1]`.
  - Returns `{ x: 0, y: 0, magnitude: 0 }` when inactive or when `magnitude < deadzone`.

### `src/systems/movement.js` (new)

Pure helper extracted so `Player`'s movement math is testable without Phaser.

```js
export function applyVelocity(x, y, vx, vy, deltaMs, bounds) {
  const nx = clamp(x + vx * (deltaMs / 1000), bounds.minX, bounds.maxX);
  const ny = clamp(y + vy * (deltaMs / 1000), bounds.minY, bounds.maxY);
  return { x: nx, y: ny };
}
```

### `src/entities/Player.js` (changes)

- New field `_vx = 0`, `_vy = 0`, `_bounds = null`.
- New method `setVelocity(vx, vy)` — stores the latest velocity.
- New method `setBounds({ minX, minY, maxX, maxY })` — stores the clamp rectangle.
- New method `update(deltaMs)` — calls `applyVelocity`, then re-positions `graphics`, `_numberText`, `_footBall`, and `_shieldGlow` (same logic as today's `moveTo` body).
- `moveTo(x, y)` stays as-is for the initial spawn placement.

### `src/scenes/GameScene.js` (changes)

In `create()`:
- Instantiate `this._joystick = new VirtualJoystick(CONFIG.controls.joystick)`.
- Create two `add.graphics()` for base ring and thumb nub, depth 15, `scrollFactor 0`, initially hidden.
- Replace the old `pointermove`/`pointerdown` listeners with handlers that route into the joystick and call `_renderJoystick()`.
- Add a `pointerup` listener that also routes into the joystick.
- Create `this._cursors = this.input.keyboard.createCursorKeys()`.
- Compute and store player bounds; call `this._player.setBounds(bounds)`.

In `update(time, delta)`:
- Compute the input vector: joystick if active, else `_keyboardVector()`.
- `this._player.setVelocity(v.x * playerMaxSpeed, v.y * playerMaxSpeed)`.
- `this._player.update(delta)`.

New helper `_keyboardVector()`:
- Returns `{ x, y }` from arrow keys, normalized when diagonal so cardinal and diagonal speeds match.

New helper `_renderJoystick()`:
- When `joystick.active`, draws the base ring at `(baseX, baseY)` and the thumb nub at `(thumbX, thumbY)`, shows both graphics.
- Otherwise hides both.

### `src/config.js` (changes)

```js
controls: {
  joystick: {
    baseRadius: 60,
    thumbMaxRadius: 50,
    deadzone: 0.15,
  },
  playerMaxSpeed: 350,
},
```

## Bounds

The pitch fills the canvas, but the HUD lives in the top-left (hearts at `y ≈ 18`, level text at `y ≈ 48`) and top-right (score badge). To keep the player visually clear of the HUD strip:

- `minY = 80` (below the HUD band)
- `maxY = height - playerHalfHeight`
- `minX = playerHalfWidth`
- `maxX = width - playerHalfWidth`

Half-extents use `CONFIG.player.scale`. Concrete values at scale 1.75: half-width ≈ 18·1.75 ≈ 32 px, half-height ≈ 30·1.75 ≈ 53 px.

## Visuals

- **Base ring:** `strokeCircle(0, 0, baseRadius)` with `lineStyle(4, 0xffffff, 0.35)`.
- **Thumb nub:** `fillCircle(0, 0, 22)` with `fillStyle(0xffffff, 0.55)`.
- Depth 15 (above HUD-10, below level-up popup-20), `scrollFactor 0`.
- Both hidden via `setVisible(false)` when joystick is inactive.

## Edge cases

- **Pointer leaves canvas mid-drag** → Phaser fires `pointerup`, joystick deactivates, velocity falls to 0.
- **Multi-touch** → only the first pointer drives the stick; subsequent pointers ignored until release.
- **Game over** → `update()` early-returns before reading input, so the player stops naturally.
- **Initial spawn** → `Player` is constructed at `(width * 0.25, height * 0.6)` and `moveTo` is no longer called from a pointer event, so the spawn position is the resting position until the user touches.

## Testing

### Unit tests (Vitest, Node)

`tests/systems/VirtualJoystick.test.js`:
- starts inactive; `vector` is `{0, 0, 0}`
- `onPointerDown(id, 100, 200)` activates, anchors base and thumb at `(100, 200)`
- `onPointerMove` with same pointer id updates thumb; vector direction matches
- thumb beyond `thumbMaxRadius` is clamped to the ring; magnitude caps at 1
- magnitude below `deadzone` returns `{0, 0, 0}`
- diagonal at max: `(thumbMaxRadius, thumbMaxRadius)` → magnitude 1, x ≈ y ≈ 0.707
- `onPointerUp` with same id deactivates and resets state
- second `onPointerDown` while active is ignored
- `onPointerMove`/`onPointerUp` with non-matching id is ignored

`tests/systems/movement.test.js`:
- zero velocity returns unchanged position
- positive vx moves x forward by `vx * delta/1000`
- clamping at each of `minX`, `maxX`, `minY`, `maxY`
- diagonal motion clamps per-axis independently (one axis at the wall does not block the other)

### Manual (browser)

- Touch anywhere on the pitch → joystick base appears at that spot.
- Drag → thumb follows within the ring; player moves smoothly in that direction at speed proportional to deflection.
- Release → joystick disappears, player stops.
- Player cannot overlap the HUD band, cannot leave the screen.
- Arrow keys on desktop drive the player when the joystick is inactive.
- Game over freezes movement.
- Existing features (defenders, balls, shields, level-up popup) still work.

## TDD order

1. Write `VirtualJoystick` tests → implement → green.
2. Write `movement.js` tests → implement → green.
3. Wire into `Player` and `GameScene`. Verify in browser.
4. Remove the old `pointermove`/`pointerdown` handlers.
5. Commit after each green step.

## Out of scope

- Customizable joystick position or size in `config.js` beyond the constants above.
- Visual polish (gradients, animations, fade-in on touch). Reserve for a follow-up if Stan wants it.
- Haptic feedback.
- Accelerometer / tilt input.
