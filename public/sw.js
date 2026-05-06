const CACHE_NAME = "woojusoul-v3";
const IMAGE_CACHE = "woojusoul-images-v1";

const PRECACHE_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
  "/woojusoulicon.png",
];

const isDev =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  if (isDev) { self.skipWaiting(); return; }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate (이전 캐시 삭제) ─────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── 전략 함수 ─────────────────────────────────────────────────────────────────

// Network First: 네트워크 시도 → 성공 시 캐시 저장 → 실패 시 캐시 반환
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then(
        (cached) =>
          cached ??
          new Response("오프라인 상태입니다.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
      )
    );
}

// Cache First: 캐시 우선 → 없으면 네트워크 후 캐시 저장
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type !== "opaque") {
          cache.put(request, response.clone());
        }
        return response;
      });
    })
  );
}

// Stale While Revalidate: 캐시 즉시 반환 + 백그라운드에서 캐시 갱신
function staleWhileRevalidate(request) {
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      });
      return cached ?? fetchPromise;
    })
  );
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (isDev) return;

  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // API 요청 → 항상 네트워크 (캐시 금지)
  if (url.pathname.startsWith("/api/")) return;

  // 이미지 파일 (동일 출처 + Supabase CDN) → Cache First
  const isImage = /\.(png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname);
  const isSupabaseStorage = url.hostname.endsWith(".supabase.co");
  if (isImage || isSupabaseStorage) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // 폰트 → Cache First
  if (/\.(woff2?|ttf|eot)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // 교차 출처 (이미지/폰트 외) → 패스스루
  if (url.origin !== self.location.origin) return;

  // Next.js 정적 에셋 (콘텐츠 해시 포함) → Stale While Revalidate
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 나머지 /_next/ (데이터 라우트 등) → 패스스루
  if (url.pathname.startsWith("/_next/")) return;

  // HTML 페이지 → Network First
  if (
    request.headers.get("accept")?.includes("text/html") ||
    !url.pathname.includes(".")
  ) {
    event.respondWith(networkFirst(request));
    return;
  }
});
