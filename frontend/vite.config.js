import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function getBackendTarget() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const backendEnvPath = path.resolve(currentDir, '..', 'backend', '.env');

  const envText = fs.readFileSync(backendEnvPath, 'utf8');
  const match = envText.match(/^PORT\s*=\s*(\d+)/m);

  if (!match) {
    throw new Error('Backend PORT not found in backend/.env');
  }

  return `http://localhost:${match[1]}`;
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: getBackendTarget(),
        changeOrigin: true
      },
      '/socket.io': {
        target: getBackendTarget(),
        changeOrigin: true,
        ws: true
      },
      '/uploads': {
        target: getBackendTarget(),
        changeOrigin: true
      }
    }
  }
});
