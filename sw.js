const CACHE = 'docunlocker-v2026.11.12.4';
const OFFLINE_PAGE = './';
// The page is required; the rest are best-effort so a missing file can never stop the install.
const EXTRA_PRECACHE = [
  './manifest.json', './jszip.min.js', './qpdf.js', './qpdf.wasm',
  './icon-192.png', './icon-512.png', './icon-maskable-192.png', './icon-maskable-512.png',
  './apple-touch-icon.png', './sscr.png',
  './outfit-latin-600-normal.woff2', './inter-latin-400-normal.woff2',
  './inter-latin-500-normal.woff2', './great-vibes-latin-400-normal.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.add(OFFLINE_PAGE)
        .then(() => Promise.all(EXTRA_PRECACHE.map(u => cache.add(u).catch(() => {})))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first (so updates arrive quickly), cache as the offline fallback.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(
    fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
      }
      return response;
    }).catch(() => caches.match(request).then(cached => {
      if (cached) return cached;
      return request.mode === 'navigate' ? caches.match(OFFLINE_PAGE) : Response.error();
    }))
  );
});
