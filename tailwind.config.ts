import type { Config } from "tailwindcss";

/**
 * ★ 디자인 토큰 단일 정의처 (제품 불변 규칙 #4)
 * - 색·라운드·그림자·간격·폰트는 여기 토큰만 사용. 임의 hex(`bg-[#...]`)·인라인 style 색상 금지.
 * - "죄책감 제로"(불변 #1): 빨강 계열 경고색을 토큰에 넣지 않는다. 강조는 `peach`(복숭아톤).
 * - Mochi Design System(로컬)과 1:1 동기화: cream/cocoa/peach/mint/lavender/butter.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: "#FFF8F0", 50: "#FFFDFA", 100: "#FFF8F0", 200: "#FBEFE2" },
        cocoa: { DEFAULT: "#6B5B53", soft: "#8C7D74", faint: "#B6A89F" },
        peach: { DEFAULT: "#FFD2B8", soft: "#FFE4D4", deep: "#F7B79A" },
        mint: { DEFAULT: "#BCEBD3", soft: "#DBF5E7", deep: "#93DBB8" },
        lavender: { DEFAULT: "#DCD2F2", soft: "#ECE6F8", deep: "#C4B5EA" },
        butter: { DEFAULT: "#FCEFC0", soft: "#FEF7DE", deep: "#F4DF96" },
      },
      fontFamily: {
        // 본문 = Gowun Dodum(부드러움), 제목·마스코트 보이스 = Jua(둥글·말랑)
        sans: ["var(--font-body)", "Apple SD Gothic Neo", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Apple SD Gothic Neo", "system-ui", "sans-serif"],
      },
      fontSize: {
        // DS 타입 스케일 (모바일 448px 기준)
        hero: ["34px", { lineHeight: "1.2" }],
        title: ["22px", { lineHeight: "1.3" }],
      },
      borderRadius: {
        // 큰 라운드 (DS: sm 16 · base 24 · lg 32)
        mochi: "1.5rem",
        "mochi-lg": "2rem",
        "mochi-sm": "1rem",
      },
      boxShadow: {
        // 말랑한 코코아톤 그림자 (하드 블랙 엣지 금지)
        mochi: "0 8px 24px -8px rgba(140, 125, 116, 0.25)",
        "mochi-press": "0 2px 8px -4px rgba(140, 125, 116, 0.3)",
        "mochi-lift": "0 14px 32px -10px rgba(140, 125, 116, 0.3)",
      },
      transitionTimingFunction: {
        // 젤리처럼 튀는 프레스 / 부드러운 페이드
        jelly: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        soft: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "mochi-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "mochi-pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "mochi-bob": "mochi-bob 2.4s ease-in-out infinite",
        "mochi-pop": "mochi-pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
