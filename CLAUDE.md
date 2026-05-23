# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server on localhost:5173
npm run build     # production build to dist/
npm test          # run all unit tests (vitest)
npx vitest run tests/systems/DifficultyManager.test.js  # single test file
```

## Working in this codebase

- **All personalization lives in `src/config.js`** — colors, name, number, speed, scoring. Start there for any gameplay or visual tweak.
- **`src/systems/` classes are pure JS** (no Phaser) — keep them that way so they stay unit-testable in Node.
- **Phaser entities/scenes cannot be unit-tested** — verify those changes via the dev server in a browser.
- When touching `Player`, `this._numberText` is a separate Phaser Text object that must always be moved, shown, and hidden alongside `this.graphics`.
- New transient popups (level-up banners, etc.) belong at depth 20; HUD at depth 10; player at depth 5.

## Keeping docs up-to-date

- When adding a new scene, entity, or system: update [`docs/architecture.md`](docs/architecture.md) (scene flow, layer breakdown, depth table).
- When discovering a non-obvious pattern or constraint (e.g. a Phaser quirk, a collision assumption): add it to the relevant section in `docs/architecture.md`.
- When adding a new npm script or a new rule that future Claude instances must follow: update this file.
- Do **not** document things that are obvious from reading the code.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for scene flow, layer breakdown, and key GameScene patterns.
