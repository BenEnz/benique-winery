// BENIQUE Winery – Service Worker
// Strategie: Network-first für index.html (immer aktuellste Version wenn online),
// Cache-Fallback wenn offline. Icons/Manifest cache-first.
const CACHE = 'benique-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Nur eigene Ressourcen behandeln – API-Calls (Wetter, Wix, GitHub) gehen direkt ins Netz
  if (url.origin !== location.origin) return;

  if (e.request.mode === 'navigate' || url.pathname.endsWith('index.html')) {
    // Network-first: aktuellste App-Version, offline aus dem Cache
    e.respondWith(
      fetch(e.request)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  } else {
    // Cache-first für Icons/Manifest
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
      }))
    );
  }
});
