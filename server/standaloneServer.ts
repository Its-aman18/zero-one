// ZERO → ONE LAN Fallback Standalone Server
// Enables running the authoritative backend directly on a local network (LAN)
// without requiring an external internet connection or cloud dependency.
// Used for venue fallback, offline hackathons, and high-security isolation.

import { createServer } from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { zeroOneBackendMiddleware, serverEngine } from './zeroOneBackend.ts';

const PORT = parseInt(process.env.PORT || '5174', 10);
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  // Let the backend middleware handle /api routes
  zeroOneBackendMiddleware(req, res, () => {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Production bundle not built. Run npm run build first.' }));
    }

    let reqPath = (req.url || '/').split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    let filePath = path.join(distDir, reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, reqPath.startsWith('/admin') ? 'admin.html' : 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File not found on ZERO → ONE LAN Fallback Server' }));
  });
});

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`ZERO → ONE AUTHORITATIVE LAN FALLBACK SERVER ONLINE`);
  console.log(`Listening on: http://${HOST}:${PORT}`);
  console.log(`Authoritative Sequence: ${serverEngine.getAuthoritativeState().eventSequence}`);
  console.log(`Clock Running: ${serverEngine.getAuthoritativeState().serverClock.isClockRunning}`);
  console.log('====================================================');
});

export default server;
