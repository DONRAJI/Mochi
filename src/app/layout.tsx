import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "모찌 — 오늘도 잘 먹었어요",
  description: "죄책감 없는 다이어트 컴패니언. 제안 → 기록 → 수집.",
};

export const viewport: Viewport = {
  themeColor: "#FFF8F0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
