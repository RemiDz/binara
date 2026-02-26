const APP_CACHE = 'binara-app-v3';
const AUDIO_CACHE = 'binara-audio-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== APP_CACHE && k !== AUDIO_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API routes (licence, etc.)
  if (url.pathname.startsWith('/api/')) return;

  // Skip analytics
  if (request.url.includes('plausible.io')) return;

  // Ambient audio files: cache on first use (separate cache)
  if (url.pathname.startsWith('/audio/ambient/')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(APP_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache same-origin requests
        if (response.ok && request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(APP_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
