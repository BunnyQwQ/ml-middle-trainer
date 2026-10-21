import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// base: './' -> relative asset urls. Works on GitHub Pages in a subpath,
// on any other static host, and from a locally served dist/ folder.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
  optimizeDeps: { exclude: ['@duckdb/duckdb-wasm'] },
  worker: { format: 'es' },
});
