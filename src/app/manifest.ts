import type { MetadataRoute } from "next";

/**
 * 웹 앱 매니페스트 (/manifest.webmanifest) — PWA·플레이스토어 TWA 래핑의 기반.
 * 색은 디자인 토큰(cream/mint, 불변 #4)과 일치. 아이콘은 마스코트 기반(public/icons).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "모찌 — 죄책감 없는 다이어트 컴패니언",
    short_name: "모찌",
    description: "오늘 뭐 먹지, 모찌가 대신 골라줄게요. 제안 → 기록 → 수집.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF8F0",
    theme_color: "#FFF8F0",
    lang: "ko",
    categories: ["health", "lifestyle", "food"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
