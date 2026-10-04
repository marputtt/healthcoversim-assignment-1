import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
export default defineConfig({
  root: root + 'frontend',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    fs: { allow: [root] },
    proxy: { '/api': `http://127.0.0.1:${process.env.PORT || 3001}` },
  },
  build: { outDir: root + 'dist', emptyOutDir: true },
});
