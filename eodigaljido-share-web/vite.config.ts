import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://3.36.85.213:8080', changeOrigin: true },
      '/geocode': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geocode/, ''),
      },
    },
  },
  preview: { port: 4174 },
});
