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
