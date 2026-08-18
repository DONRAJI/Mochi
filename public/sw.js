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

// ── 저녁 리마인더 (웹푸시) ──
// 서버는 페이로드 없이 "깨워라"만 보낸다(webpush.ts — RFC 8291 암호화 회피).
// 문구는 이 기기에서 그 시각에 맞게 정한다. 톤은 재촉이 아니라 제안(불변 #1).
self.addEventListener("push", (event) => {
  const hour = new Date().getHours();
  const body =
    hour >= 16
      ? "오늘 저녁 뭐 먹을지, 모찌가 골라놨어요 🍽️"
      : "오늘 뭐 먹을지, 모찌가 골라놨어요 🍽️";
  event.waitUntil(
    self.registration.showNotification("모찌", {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "mochi-meal-reminder", // 같은 태그 = 쌓이지 않고 교체(알림 도배 방지)
      data: { url: "/meals" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const win of wins) {
        if ("focus" in win) {
          if (win.navigate) win.navigate(url);
          return win.focus();
        }
      }
      return self.clients.openWindow(url);
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
