/** Final QA Candidate SW — user-click register only; does not control active index.html */
const CACHE_VERSION = 'tg-top-tg-final-qa-candidate-v1.1';
const CACHE_NAME = `tg-top-tg-final-qa-candidate-cache-${CACHE_VERSION}`;

const CANDIDATE_SHELL = [
  './final-qa-candidate.html',
  './index_2027_top_tg_final_qa_candidate.html',
  './src/tg-top-tg-final-qa-candidate.js',
  './src/tg-integrated-technology-candidate.js',
  './src/tg-audioworklet-parity-v2-candidate.js',
  './src/tg-audioworklet-parity-v2-processor.js',
  './src/tg-wav-productization-v2-candidate.js',
  './harnesses/wav_pcm/wav_core.js',
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
          .filter((k) => k.startsWith('tg-top-tg-final-qa-candidate-cache-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.includes('index_2027_top_tg_final_qa_candidate') && !url.pathname.includes('final-qa-candidate')) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});
