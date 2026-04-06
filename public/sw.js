const CACHE = 'flow-wealth-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add('/'))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from same origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never cache API calls — let them succeed or fail naturally
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests: network-first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      // Fire the network request to keep the cache fresh (background revalidation)
      const fetchPromise = fetch(request).then((res) => {
        if (res.ok) {
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
        }
        return res;
      });
      // Return cached immediately if available; otherwise wait for fetch.
      // Never reuse `cached` as a fetch fallback — its body is already consumed
      // once returned to the browser, causing "Response body is already used".
      return cached || fetchPromise.catch(() => Response.error());
    })
  );
});
