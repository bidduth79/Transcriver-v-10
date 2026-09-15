import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { exec } from 'child_process';
import fs from 'fs';

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
            if (fs.existsSync(fullPath)) {
              exec(`explorer "${fullPath.replace(/\//g, '\\')}"`);
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
      plugins: [react(), tailwindcss(), openFolderPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
