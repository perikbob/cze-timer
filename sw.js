// Uren – service worker. Bump VERSION when you change any of the ASSETS.
const VERSION = 'uren-2026-09-14b';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './fonts/InstrumentSans.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // The app itself: serve from cache at once, refresh the cache in the background.
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(VERSION).then(async cache => {
      const cached = await cache.match('./index.html');
      const refresh = fetch('./index.html').then(res => { if (res.ok) cache.put('./index.html', res.clone()); return res; }).catch(() => null);
      if (cached) { e.waitUntil(refresh); return cached; }
      return (await refresh) || new Response('Offline en nog niet eerder geladen.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }));
    return;
  }

  // Everything else (font, icons, manifest): cache first, network as fallback.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) caches.open(VERSION).then(c => c.put(req, res.clone()));
    return res;
  })));
});
