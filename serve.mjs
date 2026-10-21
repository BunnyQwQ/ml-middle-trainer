#!/usr/bin/env node
/**
 * Zero-dependency static server for a built copy of the trainer.
 *
 * Why this exists: the SQL and Python engines are WebAssembly running in web
 * workers, and browsers refuse both over file://. So opening dist/index.html by
 * double-clicking cannot work, while one `node serve.mjs` does.
 *
 * Usage: node serve.mjs [dir=dist] [port=4173]
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? process.env.PORT ?? 4173);

if (!existsSync(join(root, 'index.html'))) {
  console.error(`No index.html in ${root}. Run "npm run build" first.`);
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const requested = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let filePath = resolve(join(root, normalize(requested)));

  // Never serve anything outside the published folder.
  if (!filePath.startsWith(root + sep) && filePath !== root) {
    res.writeHead(403).end('forbidden');
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }
  if (!existsSync(filePath)) {
    // Hash routing means every path is really index.html.
    filePath = join(root, 'index.html');
  }

  const type = TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, {
    'content-type': type,
    'cache-control': 'no-cache',
    // Needed if a future lesson wants SharedArrayBuffer-backed DuckDB threads.
    'cross-origin-opener-policy': 'same-origin',
  });
  createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`ML Middle Trainer is served from ${root}`);
  console.log(`Open http://localhost:${port}`);
});
