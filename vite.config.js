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
