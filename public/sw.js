/**
 * Offline support. Deliberately simple: no build-time precache manifest, just
 * runtime caching of whatever the app actually fetches, including the DuckDB
 * and Pyodide payloads from the CDN. After one online visit the whole trainer
 * works on a plane.
 *
 * Bump CACHE when the caching strategy itself changes; app assets are hashed
 * by Vite, so new builds simply fetch new names.
 */
const CACHE = 'mlmt-runtime-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Navigation: network first, so a new deploy is picked up immediately.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cached = await caches.match(request);
          return cached ?? (await caches.match('./index.html')) ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Everything else: serve from cache, refresh in the background.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone()).catch(() => undefined);
          }
          return response;
        })
        .catch(() => undefined);
      return cached ?? (await network) ?? Response.error();
    })(),
  );
});
