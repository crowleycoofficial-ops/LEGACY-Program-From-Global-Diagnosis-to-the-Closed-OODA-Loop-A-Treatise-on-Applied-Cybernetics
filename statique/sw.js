// sw.js — Service Worker pour support Offline permanent
// Garantit le démarrage instantané de l'indexeur et du globe sans aucune connexion.

const CACHE_NAME = 'forgeron-souverain-v3';
const ASSETS = [
  './',
  './index.html',
  './forgeron.js',
  './sentinel.js',
  './bridge.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Mode cache puis réseau statique
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // Fallback orage local
        console.warn("Réseau coupé. Fonctionnement autonome sur cache local.");
      });
    })
  );
});
