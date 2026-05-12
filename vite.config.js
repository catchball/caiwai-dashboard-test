import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/caiwai-dashboard-test/',   // GitHub Pages: https://<user>.github.io/caiwai-dashboard-test/
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          lucide: ['lucide-react'],
          recharts: ['recharts'],
        },
      },
    },
  },
});