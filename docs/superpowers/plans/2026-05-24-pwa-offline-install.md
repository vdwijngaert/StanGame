# PWA Offline & Install Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make StanGame installable as a PWA and fully playable offline after first load, with a custom SVG app icon.

**Architecture:** Use `vite-plugin-pwa` to generate a Web App Manifest and a Workbox-based service worker at build time. The plugin precaches Vite's hashed bundle output so the entire SPA works offline. A single SVG icon (yellow background, black-and-white football, black "10" overlay) serves all install targets via `purpose: 'any maskable'`.

**Tech Stack:** Vite 6, `vite-plugin-pwa` (Workbox under the hood), Phaser 3 (unchanged), GitHub Pages (already deployed at `https://vdwijngaert.github.io/StanGame/`).

**Spec:** `docs/superpowers/specs/2026-05-24-pwa-offline-install-design.md`

---

## File Structure

| File | Responsibility |
| --- | --- |
| `package.json` | New devDep: `vite-plugin-pwa` |
| `vite.config.js` | Register `VitePWA(...)` with manifest + Workbox config |
| `public/icon.svg` | Single scalable app icon (new file) |
| `index.html` | `theme-color` meta + SVG favicon link |

No new source modules. No changes to game code (`src/`). The plugin auto-injects SW registration into the built `index.html`.

---

## Task 1: Add vite-plugin-pwa dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the plugin as a devDep**

Run:
```bash
npm install --save-dev vite-plugin-pwa
```

Expected: `vite-plugin-pwa` appears under `devDependencies` in `package.json`, and `package-lock.json` is updated. No code changes yet.

- [ ] **Step 2: Verify the existing build still works (sanity check, plugin not wired yet)**

Run:
```bash
npm run build
```

Expected: Build succeeds. `dist/index.html` still references `/StanGame/assets/...`. No `manifest.webmanifest` or `sw.js` yet (plugin isn't registered yet).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add vite-plugin-pwa devDependency"
```

---

## Task 2: Create the SVG app icon

**Files:**
- Create: `public/icon.svg`

This file lives in `public/` so Vite copies it verbatim into `dist/` at build time (it will be served at `/StanGame/icon.svg`).

- [ ] **Step 1: Create `public/icon.svg`**

Write this exact content to `public/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Stan Dribble Runner">
  <!-- Yellow rounded-square background (Stan's shirt color) -->
  <rect width="512" height="512" rx="96" fill="#FFD700"/>

  <!-- White football, sized inside the maskable safe zone (inner 80%) -->
  <g transform="translate(256 256)">
    <circle r="160" fill="#FFFFFF" stroke="#111111" stroke-width="10"/>

    <!-- Classic ball pattern: center pentagon + 5 surrounding patches.
         Coordinates are relative to the (256, 256) translate. -->
    <polygon points="0,-70 67,-22 41,58 -41,58 -67,-22" fill="#111111"/>
    <polygon points="0,-160 50,-130 30,-80 -30,-80 -50,-130" fill="#111111"/>
    <polygon points="160,0 130,40 80,30 80,-30 130,-40" fill="#111111"/>
    <polygon points="-160,0 -130,-40 -80,-30 -80,30 -130,40" fill="#111111"/>
    <polygon points="100,140 50,135 60,75 110,75 140,110" fill="#111111"/>
    <polygon points="-100,140 -140,110 -110,75 -60,75 -50,135" fill="#111111"/>
  </g>

  <!-- Bold "10" centered on top of the ball, contrasting against the white center pentagon.
       The center pentagon is dark, so the number is white with a dark outline for legibility. -->
  <text x="256" y="295"
        font-family="Impact, 'Arial Black', 'Helvetica Neue', sans-serif"
        font-size="150" font-weight="900" text-anchor="middle"
        fill="#FFFFFF" stroke="#111111" stroke-width="4" paint-order="stroke">10</text>
</svg>
```

- [ ] **Step 2: Visually verify the icon**

Open `public/icon.svg` in a browser (or via the dev server you'll start in a moment). Confirm at a glance:
- Yellow rounded square fills the viewport.
- A recognizable black-and-white football sits centered.
- A bold white "10" with a black outline sits on top of the ball and is readable.
- Nothing important is closer than ~51 px to any edge (maskable safe zone).

If the pentagons look off or the "10" is hard to read, tweak coordinates / font-size in this step before committing. The exact pentagon polygon is approximate — adjust freely until it looks right.

- [ ] **Step 3: Commit**

```bash
git add public/icon.svg
git commit -m "feat: add SVG app icon for PWA install"
```

---

## Task 3: Wire vite-plugin-pwa into vite.config.js

**Files:**
- Modify: `vite.config.js`

Current contents (for reference — do not duplicate the `base` logic, build on top of it):

```js
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/StanGame/' : '/',
  server: {
    host: true,
  },
  test: {
    environment: 'node',
  },
}));
```

- [ ] **Step 1: Replace `vite.config.js` with the PWA-enabled version**

Write this exact content:

```js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/StanGame/' : '/',
  server: {
    host: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Stan Dribble Runner',
        short_name: 'StanGame',
        description: 'Endless football runner — dribble past defenders with Stan.',
        lang: 'nl',
        display: 'fullscreen',
        orientation: 'portrait',
        theme_color: '#FFD700',
        background_color: '#111111',
        start_url: '/StanGame/',
        scope: '/StanGame/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        navigateFallback: '/StanGame/index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
  },
}));
```

- [ ] **Step 2: Build and verify the SW + manifest are emitted**

Run:
```bash
npm run build
```

Expected output includes lines similar to:
```
dist/manifest.webmanifest    ...
dist/sw.js                   ...
dist/workbox-<hash>.js       ...
dist/registerSW.js           ...
PWA v...
mode      generateSW
precache  N entries (... KiB)
```

Then verify the emitted files exist and contain what we expect:

```bash
ls dist/manifest.webmanifest dist/sw.js dist/icon.svg
grep -o '"name":"Stan Dribble Runner"' dist/manifest.webmanifest
grep -o '"start_url":"/StanGame/"' dist/manifest.webmanifest
grep -o 'manifest.webmanifest' dist/index.html
grep -o 'registerSW.js' dist/index.html
```

Expected: all greps print at least one match; `ls` lists all three files without errors.

- [ ] **Step 3: Smoke-test offline behavior in the preview server**

Run (in one terminal):
```bash
npm run preview -- --host
```

Note the URL it prints (e.g. `http://localhost:4173/StanGame/`).

In a Chromium-based browser:
1. Open the URL — the game should load normally.
2. Open DevTools → **Application** → **Manifest**. Confirm: name "Stan Dribble Runner", display `fullscreen`, theme color `#FFD700`, the icon renders, and there are no errors listed.
3. DevTools → **Application** → **Service Workers**. Confirm a service worker is `activated and running`.
4. DevTools → **Network** → tick **Offline**. Hard-refresh (Ctrl+Shift+R). The game should still load and play.
5. Stop the preview server (Ctrl+C).

If any of these fail, fix the config and rebuild before continuing. Common gotchas:
- 404 on `manifest.webmanifest`: `base` mismatch — confirm `base: '/StanGame/'` is active for `command === 'build'`.
- SW not registering: confirm `dist/index.html` contains `registerSW.js`.

- [ ] **Step 4: Commit**

```bash
git add vite.config.js
git commit -m "feat: generate PWA manifest and offline service worker"
```

---

## Task 4: Add favicon and theme-color to index.html

**Files:**
- Modify: `index.html`

Current contents (lines 1–24):

```html
<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>Stan Dribble Runner</title>
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
  </head>
  <body>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 1: Add favicon link, theme-color meta, and apple-touch-icon**

Use the Edit tool to replace this block:

```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>Stan Dribble Runner</title>
```

with:

```html
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#FFD700" />
    <link rel="icon" type="image/svg+xml" href="./icon.svg" />
    <link rel="apple-touch-icon" href="./icon.svg" />
    <title>Stan Dribble Runner</title>
```

Note the relative `./icon.svg` URLs: Vite rewrites these against `base` at build time, so they resolve to `/StanGame/icon.svg` in production and `/icon.svg` in dev.

- [ ] **Step 2: Verify dev server resolves the icon**

Run:
```bash
npm run dev
```

Open the printed URL. In DevTools → Network, confirm `icon.svg` returns 200 (the favicon should also appear in the browser tab). Stop the dev server.

- [ ] **Step 3: Rebuild and re-verify offline + install eligibility**

Run:
```bash
npm run build
npm run preview -- --host
```

In the browser:
1. DevTools → Application → Manifest: still green, theme-color now also visible on the address bar / tab color where the OS surfaces it.
2. DevTools → Lighthouse → run a PWA audit (Mobile, Categories: PWA). It should report the app as installable. Document any warnings inline if you choose to leave them.
3. Hard-refresh with Network → Offline ticked. The game still loads.
4. Stop the preview server.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add SVG favicon and theme-color meta"
```

---

## Task 5: Deploy and verify in production

**Files:** None modified in this task.

- [ ] **Step 1: Push to main**

```bash
git push
```

- [ ] **Step 2: Watch the GitHub Pages deploy**

Run:
```bash
RUN_ID=$(gh run list --repo vdwijngaert/StanGame --workflow "Deploy to GitHub Pages" --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN_ID" --repo vdwijngaert/StanGame --exit-status
```

Expected: workflow finishes with `success`.

- [ ] **Step 3: Verify the live PWA**

```bash
curl -sI https://vdwijngaert.github.io/StanGame/manifest.webmanifest | head -3
curl -sI https://vdwijngaert.github.io/StanGame/sw.js | head -3
curl -sI https://vdwijngaert.github.io/StanGame/icon.svg | head -3
```

Expected: each returns `HTTP/2 200`.

- [ ] **Step 4: Manual install test (one-time, no commit)**

On a phone or Chrome desktop: open `https://vdwijngaert.github.io/StanGame/`, accept the install prompt (or use the browser menu's "Install app" / "Add to Home Screen"), launch from the home/desktop icon, and confirm:
- The launcher icon shows the yellow football with "10".
- The app opens fullscreen (or standalone on iOS) without browser chrome.
- Turning the device to airplane mode and relaunching still works.

If any of these fail, file a follow-up — do not roll back. The deploy is correct even if a specific OS quirk needs tuning.

---

## Done

After Task 5, the spec's verification checklist is fully satisfied:
- ✅ `npm run build` emits manifest + SW + icon
- ✅ DevTools → Application shows a valid manifest, no errors
- ✅ Offline reload after first visit still serves the game
- ✅ Installable on Android Chrome and iOS Safari; launches and runs offline
