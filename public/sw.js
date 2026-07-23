/*
 * 모찌 서비스 워커 — PWA 설치 기준(플레이스토어 TWA) 충족용, 보수적 캐시 전략.
 *
 * 캐시하는 것: 콘텐츠 해시된 정적 자산(/_next/static/)과 앱 아이콘(/icons/)만 — 불변이라 안전.
 * 캐시하지 않는 것: 페이지·API·서명 URL(외부) — 항상 네트워크로 가서 인증·최신성을 보장한다.
 * (불변 #5 "TypeScript만" 예외 — 서비스 워커는 브라우저 제약상 .js만 가능. 2026-07-23 사용자 승인.)
 */
const CACHE = "mochi-static-v1"; // 캐시 전략을 바꾸면 버전을 올려 옛 캐시를 비운다
const STATIC_PREFIXES = ["/_next/static/", "/icons/"];

self.addEventListener("install", () => {
  self.skipWaiting(); // 새 워커가 대기 없이 활성화
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // 변경 요청은 절대 캐시하지 않음
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 외부(사진 서명 URL 등)는 건드리지 않음
  if (!STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) return; // 페이지·API → 네트워크

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      const res = await fetch(request);
      if (res.ok) cache.put(request, res.clone());
      return res;
    })(),
  );
});
