import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
    host: true,
    cors: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@frontend': resolve(__dirname, './src/frontend'),
      '@components': resolve(__dirname, './src/frontend/components'),
    },
  },
  build: {
    outDir: 'dist-frontend',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  define: {
    // Ensure process.env is available for any legacy code
    'process.env': {},
  },
});
