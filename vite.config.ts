import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      preview: {
        port: parseInt(process.env.PORT || '8080'),
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
      ],
      define: {
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
          },
          mangle: {
            safari10: true,
          },
        },
        sourcemap: true,
        chunkSizeWarningLimit: 2000,
        modulePreload: {
          polyfill: true
        },
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                if (id.includes('react-dom/server')) {
                  return 'react-dom-server';
                }
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'vendor';
                }
                if (id.includes('motion') || id.includes('lucide-react') || id.includes('tinycolor2')) {
                  return 'ui-libs';
                }
                if (id.includes('@google/genai') || id.includes('axios') || id.includes('googleapis')) {
                  return 'services';
                }
                if (id.includes('jszip') || id.includes('file-saver')) {
                  return 'zip-libs';
                }
                return 'others';
              }
            }
          }
        }
      }
    };
});
