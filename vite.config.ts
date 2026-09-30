import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve('.') },
    ],
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:8089', changeOrigin: false } },
  },
  publicDir: 'public',
});
