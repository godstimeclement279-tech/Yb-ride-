import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@yb/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 5175,
    host: true,
  },
});
