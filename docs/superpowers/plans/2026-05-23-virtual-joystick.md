# Virtual Joystick Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the touch-to-snap control scheme with a floating analog virtual joystick that drives velocity-based player movement, clamped to the pitch, with arrow-key fallback on desktop.

**Architecture:** A pure `VirtualJoystick` system class owns input state and exposes a normalized vector. A pure `applyVelocity` helper handles position integration and clamping. `Player` gains `setVelocity` / `setBounds` / `update`. `GameScene` wires pointer + keyboard input into the joystick, renders its visuals, and feeds the vector into the player each frame.

**Tech Stack:** Phaser 3, Vitest (Node, no Phaser in tests).

---

## File Structure

**New files:**
- `src/systems/VirtualJoystick.js` — input state machine; `onPointerDown/Move/Up` + `vector` getter.
- `src/systems/movement.js` — pure `applyVelocity(x, y, vx, vy, deltaMs, bounds)` helper.
- `tests/systems/VirtualJoystick.test.js` — unit tests.
- `tests/systems/movement.test.js` — unit tests.

**Modified files:**
- `src/config.js` — add `controls.joystick` and `controls.playerMaxSpeed`.
- `src/entities/Player.js` — add `setVelocity`, `setBounds`, `update`; keep `moveTo` for spawn.
- `src/scenes/GameScene.js` — replace pointer handlers with joystick wiring, add keyboard, render joystick graphics, call `player.update(delta)` from `update()`.

---

## Task 1: Add controls config

**Files:**
- Modify: `src/config.js`

- [ ] **Step 1: Add `controls` section to CONFIG**

Open `src/config.js` and add a new top-level key inside `CONFIG`, after `lives` and `invincibilityDuration`:

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

- [ ] **Step 2: Run all tests to verify nothing broke**

Run: `npm test`
Expected: All existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/config.js
git commit -m "feat: add controls config for joystick + player max speed"
```

---

## Task 2: VirtualJoystick — inactive state and activation

**Files:**
- Create: `src/systems/VirtualJoystick.js`
- Test: `tests/systems/VirtualJoystick.test.js`

- [ ] **Step 1: Write failing tests for initial state and pointer-down**

Create `tests/systems/VirtualJoystick.test.js`:

```js
// tests/systems/VirtualJoystick.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualJoystick } from '../../src/systems/VirtualJoystick.js';

const cfg = { baseRadius: 60, thumbMaxRadius: 50, deadzone: 0.15 };

describe('VirtualJoystick', () => {
  let j;
  beforeEach(() => {
    j = new VirtualJoystick(cfg);
  });

  it('starts inactive with zero vector', () => {
    expect(j.active).toBe(false);
    expect(j.vector).toEqual({ x: 0, y: 0, magnitude: 0 });
  });

  it('activates on pointer down and anchors base + thumb', () => {
    j.onPointerDown(1, 100, 200);
    expect(j.active).toBe(true);
    expect(j.baseX).toBe(100);
    expect(j.baseY).toBe(200);
    expect(j.thumbX).toBe(100);
    expect(j.thumbY).toBe(200);
    expect(j.vector).toEqual({ x: 0, y: 0, magnitude: 0 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/systems/VirtualJoystick.test.js`
Expected: FAIL — `Cannot find module '.../VirtualJoystick.js'`.

- [ ] **Step 3: Create minimal VirtualJoystick to pass**

Create `src/systems/VirtualJoystick.js`:

```js
// src/systems/VirtualJoystick.js
export class VirtualJoystick {
  constructor(cfg) {
    this._cfg = cfg;
    this.active = false;
    this.pointerId = null;
    this.baseX = 0;
    this.baseY = 0;
    this.thumbX = 0;
    this.thumbY = 0;
  }

  onPointerDown(pointerId, x, y) {
    if (this.active) return;
    this.active = true;
    this.pointerId = pointerId;
    this.baseX = x;
    this.baseY = y;
    this.thumbX = x;
    this.thumbY = y;
  }

  get vector() {
    if (!this.active) return { x: 0, y: 0, magnitude: 0 };
    const dx = this.thumbX - this.baseX;
    const dy = this.thumbY - this.baseY;
    const mag = Math.sqrt(dx * dx + dy * dy) / this._cfg.thumbMaxRadius;
    if (mag < this._cfg.deadzone) return { x: 0, y: 0, magnitude: 0 };
    return { x: dx / this._cfg.thumbMaxRadius, y: dy / this._cfg.thumbMaxRadius, magnitude: Math.min(mag, 1) };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/systems/VirtualJoystick.test.js`
Expected: PASS — both tests green.

---

## Task 3: VirtualJoystick — pointer move and clamping

**Files:**
- Modify: `src/systems/VirtualJoystick.js`
- Modify: `tests/systems/VirtualJoystick.test.js`

- [ ] **Step 1: Add failing tests for pointerMove and ring clamping**

Append inside the `describe` block in `tests/systems/VirtualJoystick.test.js`, before the closing `});`:

```js
  it('updates thumb on pointer move within the ring', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerMove(1, 130, 100); // 30px right, inside thumbMaxRadius=50
    expect(j.thumbX).toBe(130);
    expect(j.thumbY).toBe(100);
    const v = j.vector;
    expect(v.x).toBeCloseTo(0.6, 5);  // 30/50
    expect(v.y).toBeCloseTo(0, 5);
    expect(v.magnitude).toBeCloseTo(0.6, 5);
  });

  it('clamps thumb to the ring at thumbMaxRadius', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerMove(1, 300, 100); // 200px right, far beyond thumbMaxRadius=50
    expect(j.thumbX).toBe(150); // clamped to baseX + thumbMaxRadius
    expect(j.thumbY).toBe(100);
    const v = j.vector;
    expect(v.x).toBeCloseTo(1, 5);
    expect(v.magnitude).toBeCloseTo(1, 5);
  });

  it('clamps diagonal thumb to the ring with normalized direction', () => {
    j.onPointerDown(1, 0, 0);
    j.onPointerMove(1, 100, 100); // direction (1,1), distance 141, clamped to 50
    const expected = 50 / Math.sqrt(2);
    expect(j.thumbX).toBeCloseTo(expected, 5);
    expect(j.thumbY).toBeCloseTo(expected, 5);
    const v = j.vector;
    expect(v.magnitude).toBeCloseTo(1, 5);
    expect(v.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(v.y).toBeCloseTo(Math.SQRT1_2, 5);
  });

  it('returns zero vector inside the deadzone', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerMove(1, 103, 100); // 3px / 50 = 0.06 < 0.15 deadzone
    expect(j.vector).toEqual({ x: 0, y: 0, magnitude: 0 });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/systems/VirtualJoystick.test.js`
Expected: FAIL — `onPointerMove` is not a function.

- [ ] **Step 3: Implement onPointerMove with clamping**

Add this method to `src/systems/VirtualJoystick.js` inside the class (after `onPointerDown`):

```js
  onPointerMove(pointerId, x, y) {
    if (!this.active || pointerId !== this.pointerId) return;
    const dx = x - this.baseX;
    const dy = y - this.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const max = this._cfg.thumbMaxRadius;
    if (dist <= max) {
      this.thumbX = x;
      this.thumbY = y;
    } else {
      this.thumbX = this.baseX + (dx / dist) * max;
      this.thumbY = this.baseY + (dy / dist) * max;
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/systems/VirtualJoystick.test.js`
Expected: PASS — all tests green so far.

---

## Task 4: VirtualJoystick — pointer up and multi-touch rules

**Files:**
- Modify: `src/systems/VirtualJoystick.js`
- Modify: `tests/systems/VirtualJoystick.test.js`

- [ ] **Step 1: Add failing tests for pointerUp and pointer-id matching**

Append inside the `describe` block, before the closing `});`:

```js
  it('deactivates and zeroes vector on pointer up', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerMove(1, 140, 100);
    j.onPointerUp(1);
    expect(j.active).toBe(false);
    expect(j.vector).toEqual({ x: 0, y: 0, magnitude: 0 });
  });

  it('ignores a second pointer down while active', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerDown(2, 300, 300);
    expect(j.baseX).toBe(100);
    expect(j.baseY).toBe(100);
    expect(j.pointerId).toBe(1);
  });

  it('ignores pointer move from a non-matching pointer id', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerMove(2, 140, 100);
    expect(j.thumbX).toBe(100);
    expect(j.thumbY).toBe(100);
  });

  it('ignores pointer up from a non-matching pointer id', () => {
    j.onPointerDown(1, 100, 100);
    j.onPointerUp(2);
    expect(j.active).toBe(true);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/systems/VirtualJoystick.test.js`
Expected: FAIL — `onPointerUp` is not a function.

- [ ] **Step 3: Implement onPointerUp**

Add this method to `src/systems/VirtualJoystick.js` inside the class (after `onPointerMove`):

```js
  onPointerUp(pointerId) {
    if (!this.active || pointerId !== this.pointerId) return;
    this.active = false;
    this.pointerId = null;
    this.thumbX = this.baseX;
    this.thumbY = this.baseY;
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/systems/VirtualJoystick.test.js`
Expected: PASS — all VirtualJoystick tests green.

- [ ] **Step 5: Commit**

```bash
git add src/systems/VirtualJoystick.js tests/systems/VirtualJoystick.test.js
git commit -m "feat: add VirtualJoystick input state machine"
```

---

## Task 5: Movement helper

**Files:**
- Create: `src/systems/movement.js`
- Test: `tests/systems/movement.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/systems/movement.test.js`:

```js
// tests/systems/movement.test.js
import { describe, it, expect } from 'vitest';
import { applyVelocity } from '../../src/systems/movement.js';

const bounds = { minX: 0, minY: 0, maxX: 800, maxY: 600 };

describe('applyVelocity', () => {
  it('returns unchanged position when velocity is zero', () => {
    expect(applyVelocity(100, 200, 0, 0, 16, bounds)).toEqual({ x: 100, y: 200 });
  });

  it('integrates velocity over delta in ms', () => {
    // 350 px/s * 1000ms = 350 px
    expect(applyVelocity(100, 200, 350, 0, 1000, bounds)).toEqual({ x: 450, y: 200 });
  });

  it('clamps at maxX', () => {
    const r = applyVelocity(790, 300, 350, 0, 1000, bounds);
    expect(r.x).toBe(800);
    expect(r.y).toBe(300);
  });

  it('clamps at minX', () => {
    const r = applyVelocity(10, 300, -350, 0, 1000, bounds);
    expect(r.x).toBe(0);
  });

  it('clamps at maxY', () => {
    const r = applyVelocity(400, 590, 0, 350, 1000, bounds);
    expect(r.y).toBe(600);
  });

  it('clamps at minY', () => {
    const r = applyVelocity(400, 10, 0, -350, 1000, bounds);
    expect(r.y).toBe(0);
  });

  it('clamps each axis independently in diagonal motion', () => {
    // x goes past maxX, y stays in bounds
    const r = applyVelocity(790, 300, 350, 100, 1000, bounds);
    expect(r.x).toBe(800);
    expect(r.y).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/systems/movement.test.js`
Expected: FAIL — `Cannot find module '.../movement.js'`.

- [ ] **Step 3: Implement applyVelocity**

Create `src/systems/movement.js`:

```js
// src/systems/movement.js
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function applyVelocity(x, y, vx, vy, deltaMs, bounds) {
  const dt = deltaMs / 1000;
  return {
    x: clamp(x + vx * dt, bounds.minX, bounds.maxX),
    y: clamp(y + vy * dt, bounds.minY, bounds.maxY),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/systems/movement.test.js`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/systems/movement.js tests/systems/movement.test.js
git commit -m "feat: add applyVelocity helper with axis clamping"
```

---

## Task 6: Player velocity & bounds

**Files:**
- Modify: `src/entities/Player.js`

The Player class is Phaser-coupled and not unit-tested. Movement math is already covered by `tests/systems/movement.test.js`. Verify Player changes in the browser at Task 8.

- [ ] **Step 1: Add velocity/bounds state and methods**

Open `src/entities/Player.js`. In the constructor, after `this._invincibleCallbackTimer = null;` (around line 8), add:

```js
    this._vx = 0;
    this._vy = 0;
    this._bounds = null;
```

Add these methods to the class, right after the existing `moveTo(x, y)` method (after the closing `}` of `moveTo`):

```js
  setVelocity(vx, vy) {
    this._vx = vx;
    this._vy = vy;
  }

  setBounds(bounds) {
    this._bounds = bounds;
  }

  update(deltaMs) {
    if (!this._bounds) return;
    if (this._vx === 0 && this._vy === 0) return;
    const { x, y } = applyVelocity(this.x, this.y, this._vx, this._vy, deltaMs, this._bounds);
    this.moveTo(x, y);
  }
```

- [ ] **Step 2: Add the import at the top of the file**

Add this import at the top of `src/entities/Player.js`, above the `export class Player` line:

```js
import { applyVelocity } from '../systems/movement.js';
```

- [ ] **Step 3: Run all tests to make sure nothing regressed**

Run: `npm test`
Expected: All existing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/entities/Player.js
git commit -m "feat: add velocity-based movement to Player"
```

---

## Task 7: GameScene — wire joystick, keyboard, and render

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Add imports**

In `src/scenes/GameScene.js`, after the existing imports (after the `Shield` import line), add:

```js
import { VirtualJoystick } from '../systems/VirtualJoystick.js';
```

- [ ] **Step 2: Replace pointer listeners with joystick setup**

In `src/scenes/GameScene.js`, replace the entire `// --- Pointer input ---` block (currently lines 51–57) with:

```js
    // --- Input ---
    this._joystick = new VirtualJoystick(CONFIG.controls.joystick);
    this._joystickBase = this.add.graphics().setDepth(15).setScrollFactor(0).setVisible(false);
    this._joystickThumb = this.add.graphics().setDepth(15).setScrollFactor(0).setVisible(false);

    this.input.on('pointerdown', (ptr) => {
      this._joystick.onPointerDown(ptr.id, ptr.x, ptr.y);
      this._renderJoystick();
    });
    this.input.on('pointermove', (ptr) => {
      this._joystick.onPointerMove(ptr.id, ptr.x, ptr.y);
      this._renderJoystick();
    });
    this.input.on('pointerup', (ptr) => {
      this._joystick.onPointerUp(ptr.id);
      this._renderJoystick();
    });

    this._cursors = this.input.keyboard.createCursorKeys();

    // --- Player bounds (clamp to pitch, clear of HUD) ---
    const scale = CONFIG.player.scale;
    const halfW = 18 * scale;
    const halfH = 30 * scale;
    this._player.setBounds({
      minX: halfW,
      minY: 80,
      maxX: width - halfW,
      maxY: height - halfH,
    });
```

- [ ] **Step 3: Add _renderJoystick and _inputVector helpers**

Add these two methods to `GameScene`, after `_buildHud` and before `update`:

```js
  _renderJoystick() {
    const j = this._joystick;
    if (!j.active) {
      this._joystickBase.setVisible(false);
      this._joystickThumb.setVisible(false);
      return;
    }
    const cfg = CONFIG.controls.joystick;
    this._joystickBase.clear();
    this._joystickBase.lineStyle(4, 0xffffff, 0.35);
    this._joystickBase.strokeCircle(j.baseX, j.baseY, cfg.baseRadius);
    this._joystickBase.setVisible(true);

    this._joystickThumb.clear();
    this._joystickThumb.fillStyle(0xffffff, 0.55);
    this._joystickThumb.fillCircle(j.thumbX, j.thumbY, 22);
    this._joystickThumb.setVisible(true);
  }

  _inputVector() {
    if (this._joystick.active) {
      const v = this._joystick.vector;
      return { x: v.x, y: v.y };
    }
    const c = this._cursors;
    let x = 0, y = 0;
    if (c.left.isDown)  x -= 1;
    if (c.right.isDown) x += 1;
    if (c.up.isDown)    y -= 1;
    if (c.down.isDown)  y += 1;
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }
```

- [ ] **Step 4: Drive player from input vector in update()**

In `src/scenes/GameScene.js`, inside `update(time, delta)`, add these two lines after `this._updateEntities(delta);` and before `this._checkCollisions();`:

```js
    const v = this._inputVector();
    this._player.setVelocity(v.x * CONFIG.controls.playerMaxSpeed, v.y * CONFIG.controls.playerMaxSpeed);
    this._player.update(delta);
```

- [ ] **Step 5: Run all tests to confirm no regression**

Run: `npm test`
Expected: All tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: wire VirtualJoystick + keyboard into GameScene"
```

---

## Task 8: Browser verification

The unit-testable parts are covered. The Phaser-coupled parts (rendering, real touch events, the look of the joystick, HUD-overlap clamping) need a human eye.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server listening on `http://localhost:5173`.

- [ ] **Step 2: Verify each behavior in the browser**

Open the URL on a touch device or use Chrome DevTools mobile emulation, and check:

- Tap anywhere on the pitch → joystick base ring and thumb nub appear at that spot.
- Drag → thumb follows within the ring; player moves smoothly in that direction.
- Speed scales with deflection (small push = slow, full push = fast).
- Release → joystick disappears, player stops.
- Player cannot enter the top HUD strip (hearts / LVL / score area).
- Player cannot leave the screen on any edge.
- On desktop, arrow keys move the player when not touching; diagonals are the same speed as cardinals.
- Defenders, balls, shields, goal popup, level-up popup all still work.
- Game over (lose 3 hearts) freezes the player; existing transition to GameOverScene still runs.

- [ ] **Step 3: If anything is wrong, fix it and add a regression test**

If a bug shows up in the joystick math or movement math, add a failing unit test that reproduces it, then fix. If it's purely visual (e.g. nub size feels wrong), adjust the constants in `_renderJoystick` or `CONFIG.controls.joystick` directly.

- [ ] **Step 4: Update architecture docs**

Open `docs/architecture.md` and add a line under the systems section noting the new `VirtualJoystick` system and the new `movement.js` helper, plus the new depth-15 layer for joystick visuals.

- [ ] **Step 5: Commit**

```bash
git add docs/architecture.md
git commit -m "docs: note virtual joystick system and depth-15 layer"
```

---

## Done criteria

- All unit tests pass (`npm test`).
- Joystick behaves as described in browser verification.
- Old `pointermove`/`pointerdown` snap-to-position handlers are gone.
- `docs/architecture.md` reflects the new systems.
- Commits at each green step.
