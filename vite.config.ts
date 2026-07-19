import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'react-vendor';
              }
              if (id.includes('firebase')) {
                return 'firebase-vendor';
              }
              if (id.includes('leaflet') || id.includes('react-leaflet')) {
                return 'map-vendor';
              }
              if (id.includes('recharts')) {
                return 'chart-vendor';
              }
              if (id.includes('jspdf')) {
                return 'pdf-vendor';
              }
              if (id.includes('@headlessui') || id.includes('react-icons') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
            }
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/images/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});
