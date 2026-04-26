const CACHE_NAME = "woojusoul-v2";

// 빌드 불변 정적 에셋만 캐시 (내용 해시 포함 경로)
const PRECACHE_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
  "/woojusoulicon.png",
];

self.addEventListener("install", (event) => {
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
  const { request } = event;
  const url = new URL(request.url);

  // 외부 요청, non-GET은 무시
  if (url.origin !== self.location.origin || request.method !== "GET") return;

  // API 라우트는 항상 네트워크
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

  // /_next/ 나머지 (HMR, 데이터 등) — 네트워크 우선
  if (url.pathname.startsWith("/_next/")) return;

  // 아이콘 등 실제 정적 파일 — 캐시 우선
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

  // 페이지 내비게이션(HTML) — 항상 네트워크 우선, 실패 시 캐시
  // (HTML을 캐시 우선으로 서브하면 JS 해시 불일치로 검정 화면 발생)
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
  }
});
