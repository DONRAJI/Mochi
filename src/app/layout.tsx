import type { Metadata, Viewport } from "next";
import { Jua, Gowun_Dodum } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

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
};

export const viewport: Viewport = {
  themeColor: "#FFF8F0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${jua.variable} ${gowunDodum.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
