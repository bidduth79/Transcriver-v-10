/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
// exec removed, using execFile dynamically
import fs from 'fs';
import { execFile } from 'child_process';

// Allowed base directories for the open-folder plugin (prevents path traversal)
const ALLOWED_FOLDER_ROOTS = [
  path.resolve(__dirname, 'htdocs'),
  path.resolve(__dirname, 'dist'),
  path.resolve(__dirname, 'public'),
];

const openFolderPlugin = () => ({
  name: 'open-folder',
  configureServer(server: any) {
    server.middlewares.use('/api/open-folder', (req: any, res: any) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            let folder = data.folder || 'downloads';
            if (folder === 'downloads') {
              folder = path.join(__dirname, 'htdocs', 'licell_api', 'downloads');
            }
            const fullPath = path.resolve(folder);

            // Security: Ensure the resolved path is within an allowed directory
            const isAllowed = ALLOWED_FOLDER_ROOTS.some(root => fullPath.startsWith(root));
            if (!isAllowed) {
              res.statusCode = 403;
              res.end(JSON.stringify({ success: false, error: 'Access denied: folder outside allowed directories' }));
              return;
            }

            if (fs.existsSync(fullPath)) {
              // Use execFile instead of exec to prevent command injection
              execFile('explorer', [fullPath.replace(/\//g, '\\')], (err: any) => {
                if (err) console.warn('Could not open folder:', err.message);
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, path: fullPath }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ success: false, error: 'Folder not found' }));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      } else {
        res.statusCode = 405;
        res.end();
      }
    });
  }
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'credentialless',
        },
      },
      plugins: [
        react(), 
        tailwindcss(), 
        openFolderPlugin(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'Transcriver',
            short_name: 'Transcriver',
            description: 'AI powered fast and accurate transcription tool',
            theme_color: '#ffffff',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            maximumFileSizeToCacheInBytes: 50 * 1024 * 1024 // 50MB to accommodate ffmpeg-core.wasm
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY_1),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_API_KEY_1)
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/analytics'],
              'vendor-genai': ['@google/genai'],
              'vendor-ui': ['framer-motion', 'lucide-react'],
              'vendor-supabase': ['@supabase/supabase-js'],
            }
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'jsdom',
        setupFiles: ['./setupTests.ts'],
        globals: true
      }
    };
});
