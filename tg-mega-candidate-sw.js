/** TG Mega Tech Candidate Service Worker — registers only via explicit user click on candidate page. */
const CACHE_VERSION = 'tg-mega-candidate-v1.1';
const CACHE_NAME = `tg-mega-candidate-cache-${CACHE_VERSION}`;

const CANDIDATE_SHELL = [
  './index_2027_mega_tech_candidate.html',
  './tg-mega-candidate.webmanifest',
  './src/tg-mega-tech-candidate.js',
  './favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CANDIDATE_SHELL).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('tg-mega-candidate-cache-') && k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.includes('index_2027_mega_tech_candidate')) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'TG_MEGA_CACHE_VERSION') {
    event.source?.postMessage({ cacheVersion: CACHE_VERSION });
  }
});
