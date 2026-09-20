// Only the generic offline page is cached. Never cache credentials, orders, PINs or API responses.
const RIDER_CACHE = "aiwizchat-rider-offline-v1";
self.addEventListener("install", (event) => { event.waitUntil(caches.open(RIDER_CACHE).then((cache) => cache.add("/rider-offline.html"))); });
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate" && new URL(event.request.url).pathname === "/rider") event.respondWith(fetch(event.request).catch(() => caches.match("/rider-offline.html")));
});
