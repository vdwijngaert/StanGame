# Stan Dribble Runner — Design Spec
_2026-05-23_

## Overview

A mobile-friendly personalized endless runner football game built as a birthday gift for Stan, who turns 10 today. Stan plays as himself in his KVV Duffel kit, dribbling through defenders on a football pitch.

---

## Personalization

All player-specific values live in `src/config.js` and nowhere else:

```js
export const CONFIG = {
  player: {
    name: "Stan",
    number: 10,
    shirtColor: "#FFD700",
    shortsColor: "#111111",
    club: "KVV Duffel",
  },
  birthday: {
    show: true,
    age: 10,
    message: "Gelukkige verjaardag Stan! 🎂",
  },
};
```

Club identity: KVV Duffel — geel (#FFD700) shirt met zwarte mouwen, zwarte broek en kousen.

---

## Tech Stack

- **Phaser 3** — game engine (touch input, game loop, scene management)
- **Vite** — dev server and build tool
- **Vanilla JS (ESM)** — no additional frameworks

Run locally: `npm run dev`
Ship: `npm run build` → static output suitable for GitHub Pages or any static host

---

## Project Structure

```
StanGame/
  index.html
  src/
    config.js            ← all personalization, edit here
    main.js              ← Phaser game setup and config
    scenes/
      BootScene.js       ← asset preloading
      BirthdayScene.js   ← birthday splash
      GameScene.js       ← main gameplay
      GameOverScene.js   ← score display + replay
```

---

## Scenes

### BootScene
Preloads all assets (shapes drawn procedurally via Phaser Graphics — no external image files needed). Transitions immediately to BirthdayScene.

### BirthdayScene
- Full-screen KVV Duffel yellow background
- Large animated text: `CONFIG.birthday.message`
- Subtitle: club name + jersey number
- "Spelen!" button → transitions to GameScene
- Only shown if `CONFIG.birthday.show === true`; otherwise boots straight into GameScene

### GameScene
The endless runner. See Game Mechanics below.

### GameOverScene
- Shows final score (distance in meters)
- Shows high score (localStorage)
- "Opnieuw" button → restarts GameScene

---

## Game Mechanics

**World scrolling:** The pitch scrolls from right to left at increasing speed. Stan can be moved freely anywhere on the screen.

**Player movement:** Stan follows the player's finger/mouse freely anywhere on the screen (Phaser pointer drag). No lanes, no fixed axis.

**Defenders:** Red-shirted defenders spawn from the right edge at randomized vertical positions. Spawn rate and speed increase with difficulty level.

**Golden balls:** ⚽ collectibles spawn randomly on the field. Touching one awards +10 points.

**Scoring:** Distance traveled is the primary score (1 point per meter equivalent). Every 500m a goal-scoring animation plays (+100 points).

**Lives:** Stan has 3 lives (heart icons). A collision with a defender removes 1 life and triggers a brief invincibility + flicker animation. At 0 lives → GameOverScene.

**Difficulty progression:** Every 30 seconds, the game increases to the next level — higher scroll speed, more defenders, tighter spawn intervals. No cap.

---

## Visual Design

**Style:** Flat / Modern — no outlines, clean geometric shapes, solid colors.

**Player (Stan):**
- Round head (skin tone)
- Rectangular body: `CONFIG.player.shirtColor` (#FFD700) top, `CONFIG.player.shortsColor` (#111) bottom
- Jersey number `CONFIG.player.number` drawn on shirt
- Black boots

**Defenders:**
- Same flat style, red shirts

**Pitch:**
- Dark green field (#2d5a1b) with subtle lighter-green alternating stripes scrolling horizontally
- No pitch lines (keeps it clean)

**HUD (floating overlay):**
- Top-left: 3 heart icons (❤️) — fade out on life loss
- Top-right: distance score in bold yellow text on dark semi-transparent rounded badge
- No static bar — HUD elements float over the field

**Birthday scene:**
- Yellow background, black text, large emoji, centered layout

---

## Responsive / Mobile

- Phaser canvas scales to fill the viewport (Phaser.Scale.FIT)
- Minimum target: 375×667px (iPhone SE)
- Touch events handled natively by Phaser pointer system
- Works in desktop browser too (mouse drag)
