import { defineConfig } from 'vite';

// Relative base so the built site works from any sub-path (GitHub Pages, a CDN folder, file preview).
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
});
