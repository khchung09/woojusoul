const CACHE_NAME = "woojusoul-v2";

const PRECACHE_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
  "/woojusoulicon.png",
];

// localhost/127.0.0.1에서는 캐시를 완전히 비활성화
const isDev =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

self.addEventListener("install", (event) => {
  if (isDev) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // 개발 환경: 캐시 완전 우회, 모든 요청을 네트워크로
  if (isDev) return;

  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin || request.method !== "GET") return;

  if (url.pathname.startsWith("/api/")) return;

  // /_next/static/ — 콘텐츠 해시 포함이므로 캐시 우선 (불변)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  if (url.pathname.startsWith("/_next/")) return;

  if (/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
  }
});
