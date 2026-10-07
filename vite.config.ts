import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve('frontend') },
    ],
  },
  optimizeDeps: { include: ['leaflet'] },
  server: {
    port: 3000,
    strictPort: true,
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.private/**', '**/backend/**', '**/roles_password.txt'] },
    proxy: { '/api': { target: `http://127.0.0.1:${process.env.API_PORT || 8089}`, changeOrigin: false } },
  },
  publicDir: 'public',
});
