// BENIQUE Winery – Service Worker
// Strategie: Network-first für die App (index.html) – IMMER frisch vom Server laden
// (umgeht den HTTP-Cache via cache:'reload'), Cache dient nur als Offline-Fallback.
// Icons/Manifest cache-first. Cache-Version bei Bedarf hochzählen erzwingt Neuaufbau.
const CACHE = 'benique-v3';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Nur eigene Ressourcen behandeln – API-Calls (Wetter, Wix, GitHub) gehen direkt ins Netz
  if (url.origin !== location.origin) return;

  const istApp = e.request.mode === 'navigate' ||
                 url.pathname.endsWith('/') || url.pathname.endsWith('index.html');

  if (istApp) {
    // Network-first mit erzwungenem Frisch-Laden (umgeht den 10-Min-HTTP-Cache von GitHub Pages)
    e.respondWith(
      fetch(e.request, { cache: 'reload' })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    // Cache-first für statische Assets (Icons/Manifest)
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }))
    );
  }
});
