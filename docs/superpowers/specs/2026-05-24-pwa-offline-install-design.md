# PWA: Offline Play & Install — Design

**Date:** 2026-05-24
**Status:** Approved, pending implementation plan

## Goal

Make StanGame installable as a Progressive Web App and fully playable offline after the first load. Add an SVG app icon.

## Approach

Use [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) to generate the web manifest and a Workbox-based service worker at build time. The plugin precaches Vite's build output so the whole game (one bundle + `index.html`) works offline after the user has loaded it once.

Rationale: the game is a single-page Phaser app with no runtime API calls. Workbox precache is a perfect fit and the plugin keeps the cache list in sync with hashed asset filenames automatically.

## Manifest

| Field              | Value                          |
| ------------------ | ------------------------------ |
| `name`             | `Stan Dribble Runner`          |
| `short_name`       | `StanGame`                     |
| `lang`             | `nl`                           |
| `display`          | `fullscreen`                   |
| `orientation`      | `portrait`                     |
| `theme_color`      | `#FFD700` (Stan's shirt)       |
| `background_color` | `#111111` (matches body)       |
| `start_url`        | `/StanGame/`                   |
| `scope`            | `/StanGame/`                   |
| `icons`            | One SVG (see below), `any maskable` |

`fullscreen` falls back to `standalone` on platforms that don't support it (notably iOS Safari), which is the desired graceful degradation.

## Service Worker

- `registerType: 'autoUpdate'` — new deploys take effect on next launch without prompting.
- Workbox precache populated from Vite's manifest (`globPatterns: ['**/*.{js,css,html,svg}']`).
- Navigation fallback to `index.html` so any in-scope URL works offline.
- No runtime caching rules — the app has no network requests at runtime.

## Icon

One SVG at `public/icon.svg`, referenced from the manifest as `purpose: 'any maskable'`. Single file scales to every install target (favicon, home screen, splash) without needing a PNG pipeline.

**Concept:** classic black-and-white football centered on a yellow (#FFD700) rounded-square background, with a bold black "10" overlaid on the ball.

All visual content sits inside the inner 80% safe zone so the maskable crop doesn't clip the ball or the number on Android.

Approximate structure:

```svg
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#FFD700"/>
  <!-- white football base, inside safe zone -->
  <circle cx="256" cy="256" r="160" fill="#FFFFFF" stroke="#111111" stroke-width="8"/>
  <!-- a few black pentagons suggesting the classic pattern -->
  <!-- ... -->
  <!-- bold "10" centered -->
  <text x="256" y="300" font-family="Impact, 'Arial Black', sans-serif"
        font-size="180" font-weight="900" text-anchor="middle" fill="#111111">10</text>
</svg>
```

The exact pentagon layout will be tuned during implementation for readability at 32×32 favicon size; the "10" remains the dominant element so the icon stays legible when small.

## Files Changed

- `package.json` — add `vite-plugin-pwa` devDep.
- `vite.config.js` — register `VitePWA(...)` with the manifest & Workbox config above.
- `public/icon.svg` — new icon asset (Vite copies `public/` to `dist/` as-is).
- `index.html` — add `<meta name="theme-color" content="#FFD700">` and an SVG favicon `<link>`.

The plugin auto-injects the service-worker registration script into the built `index.html`; no manual registration code is needed.

## Verification

1. `npm run build` succeeds and emits `manifest.webmanifest` + `sw.js` + `icon.svg` into `dist/`.
2. `npm run preview` served at `/StanGame/` shows the install prompt eligibility in Chrome DevTools → Application → Manifest (no errors).
3. After one load, toggling DevTools "Offline" and refreshing still serves the game.
4. The deployed site at `https://vdwijngaert.github.io/StanGame/` is installable on Android Chrome and iOS Safari ("Add to Home Screen"); launching from the home icon shows the splash and runs offline.

## Out of Scope

- Push notifications, background sync, share-target — none are useful for this game.
- A separate PNG icon pipeline — modern install targets accept SVG; older Android versions fall back to the browser's auto-generated icon, which is acceptable.
- Update-available toast UI — `autoUpdate` is silent on purpose; the game has no in-progress state worth preserving across an update.
