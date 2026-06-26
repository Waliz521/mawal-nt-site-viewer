import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const faviconSvg = fs.readFileSync(path.resolve('public/favicon.svg'));

export default defineConfig({
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    {
      name: 'favicon-ico-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/favicon.ico') {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.end(faviconSvg);
            return;
          }
          next();
        });
      },
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'favicon.ico',
          source: faviconSvg,
        });
      },
    },
  ],
  envDir: '..',
  server: {
    port: 5173,
  },
});
