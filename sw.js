const BASE = new URL(self.registration.scope);
const PREFIX = "mansion-millions-" + encodeURIComponent(BASE.pathname) + "-";
const CACHE = PREFIX + "v3";
const FILES = ["./", "index.html", "store.html", "manifest.webmanifest", "mansion-bg.jpg", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "vendor/peerjs-1.5.4.min.js"].map(path => new URL(path, BASE).href);
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const asset = FILES.find(file => new URL(file).pathname === url.pathname);
  if (event.request.mode !== "navigate" && !asset) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const storeRoute = [new URL("store", BASE).pathname, new URL("store.html", BASE).pathname].includes(url.pathname);
    const indexRoute = [BASE.pathname, new URL("index", BASE).pathname, new URL("index.html", BASE).pathname].includes(url.pathname);
    if (event.request.mode !== "navigate") {
      const cached = await cache.match(event.request, {ignoreSearch:true});
      if (cached) return cached;
    }
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type !== "opaque") {
        try {
          await cache.put(event.request, response.clone());
          if (indexRoute || storeRoute) await cache.put(new URL(storeRoute ? "store.html" : "index.html", BASE).href, response.clone());
        } catch (cacheError) { /* Storage limits must not interrupt online play. */ }
      }
      return response;
    } catch (error) {
      const cached = await cache.match(event.request, {ignoreSearch:true});
      if (cached) return cached;
      if (event.request.mode === "navigate" && (indexRoute || storeRoute)) {
        const page = await cache.match(new URL(storeRoute ? "store.html" : "index.html", BASE).href);
        if (page) return page;
      }
      return Response.error();
    }
  })());
});
