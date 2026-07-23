"use client";

import { useEffect } from "react";

/**
 * 서비스 워커 등록 (PWA 설치 기준 — 플레이스토어 TWA).
 * 프로덕션에서만 등록 — dev에선 HMR·캐시 간섭을 피한다. 실패해도 앱 동작엔 영향 없음.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
