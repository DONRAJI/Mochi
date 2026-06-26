import type { Config } from "tailwindcss";

/**
 * ★ 디자인 토큰 단일 정의처 (제품 불변 규칙 #4)
 * - 색·라운드·그림자·간격은 여기 토큰만 사용한다. 임의 hex(`bg-[#...]`)·인라인 style 색상 금지.
 * - "죄책감 제로"(불변 #1): 빨강 계열 경고색을 토큰에 **넣지 않는다.**
 *   강조가 필요하면 빨강 대신 `peach`(복숭아톤)를 쓴다. (PRD 5.2 ExpiryShelf)
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 베이스 — 따뜻한 크림 배경, 부드러운 코코아 텍스트
        cream: {
          DEFAULT: "#FFF8F0",
          50: "#FFFDFA",
          100: "#FFF8F0",
          200: "#FBEFE2",
        },
        cocoa: {
          DEFAULT: "#6B5B53",
          soft: "#8C7D74",
          faint: "#B6A89F",
        },
        // 파스텔 4색 (PRD 9장 — 라벤더~민트 계열)
        peach: {
          DEFAULT: "#FFD2B8",
          soft: "#FFE4D4",
          deep: "#F7B79A",
        },
        mint: {
          DEFAULT: "#BCEBD3",
          soft: "#DBF5E7",
          deep: "#93DBB8",
        },
        lavender: {
          DEFAULT: "#DCD2F2",
          soft: "#ECE6F8",
          deep: "#C4B5EA",
        },
        butter: {
          DEFAULT: "#FCEFC0",
          soft: "#FEF7DE",
          deep: "#F4DF96",
        },
      },
      borderRadius: {
        // 말랑한 라운드 (PRD: 큰 라운드, 말랑 그림자)
        mochi: "1.5rem",
        "mochi-lg": "2rem",
        "mochi-sm": "1rem",
      },
      boxShadow: {
        // 부드러운 젤리 그림자 (경계 강한 그림자 금지)
        mochi: "0 8px 24px -8px rgba(140, 125, 116, 0.25)",
        "mochi-press": "0 2px 8px -4px rgba(140, 125, 116, 0.3)",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "mochi-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "mochi-bob": "mochi-bob 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
