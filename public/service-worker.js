const CACHE_NAME = "offline-cache-v1";

const STATIC_ASSETS = [
  "/", // ✅ This will cache the homepage served from `src/app/page.tsx`
  "/manifest.json",
  "/icon-192x192.svg",
  "/icon-512x512.svg",
  // DO NOT add /index.html
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) =>
            console.warn(`❌ Failed to cache ${url}`, err)
          )
        )
      );
    })
  );
  self.skipWaiting(); // Activate new SW immediately
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Cache-first strategy for static assets
  if (
    request.url.includes("/_next/") || // next.js build output
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
        );
      })
    );
    return;
  }

  // Network-first for HTML pages (like `/`)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
