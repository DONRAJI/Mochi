import type { Metadata, Viewport } from "next";
import { Jua, Gowun_Dodum } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerRegistrar } from "./ServiceWorkerRegistrar";

// 둥근 폰트 (Mochi Design System): Jua=제목·마스코트 보이스, Gowun Dodum=본문·UI
const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: false,
});
const gowunDodum = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "모찌 — 오늘도 잘 먹었어요",
  description: "죄책감 없는 다이어트 컴패니언. 제안 → 기록 → 수집.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true, // iOS 홈 화면 추가 시 앱처럼 전체화면
    title: "모찌",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF8F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // 모바일 앱 느낌 — 더블탭 확대로 레이아웃 깨짐 방지
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${jua.variable} ${gowunDodum.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
