/** Final Technology Marathon Candidate SW — user-click register only; does not control active index.html */
const CACHE_VERSION = 'tg-final-marathon-candidate-v1.2';
const CACHE_NAME = `tg-final-marathon-candidate-cache-${CACHE_VERSION}`;

const CANDIDATE_SHELL = [
  './index_2027_final_technology_marathon_candidate.html',
  './tg-final-marathon-candidate.webmanifest',
  './src/tg-final-tech-marathon-candidate.js',
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
          .filter((k) => k.startsWith('tg-final-marathon-candidate-cache-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.includes('index_2027_final_technology_marathon_candidate')) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'TG_FTM_CACHE_VERSION') {
    event.source?.postMessage({ cacheVersion: CACHE_VERSION });
  }
});
