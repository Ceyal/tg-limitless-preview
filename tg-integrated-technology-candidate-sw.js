/** Integrated Technology Candidate SW — user-click register only; does not control active index.html */
const CACHE_VERSION = 'tg-integrated-technology-candidate-v1.1';
const CACHE_NAME = `tg-integrated-technology-candidate-cache-${CACHE_VERSION}`;

const CANDIDATE_SHELL = [
  './index_2027_integrated_technology_candidate.html',
  './tg-integrated-technology-candidate.webmanifest',
  './src/tg-integrated-technology-candidate.js',
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
      Promise.all(
        keys
          .filter((k) => k.startsWith('tg-integrated-technology-candidate-cache-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.includes('index_2027_integrated_technology_candidate')) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});
