// SW di cleanup: disattiva cache e si auto-unregister per evitare loop di caricamento.
const CACHE_NAME = 'edu-tools-cleanup-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => {
      return self.registration.unregister();
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass-through: niente caching per evitare stalli.
  event.respondWith(fetch(event.request));
});
