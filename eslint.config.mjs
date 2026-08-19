import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const TOKEN_ONLY_MESSAGE =
  "디자인 토큰만 사용하세요 — 임의 hex 색상(bg-[#...], text-[#...])은 금지입니다. tailwind.config.ts 토큰(cream/peach/mint/lavender/butter, rounded-mochi, shadow-mochi)을 쓰세요. (모찌 불변규칙 #4)";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "next-env.d.ts",
      "prisma/migrations/**",
      "Mochi Design System/**",
      "public/sw.js", // 서비스 워커 — 브라우저 전역(self·caches) 사용, 앱 TS 규칙 밖(불변 #5 승인 예외)
      // Capacitor 셸 — 우리가 쓴 코드가 아니다. android/는 Gradle 생성물(빌드 산출물에
      // Capacitor의 native-bridge.js가 복사돼 들어온다), node_modules는 셸 전용 의존성.
      "native/android/**",
      "native/node_modules/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 불변규칙 #4 강제: className 안의 임의 hex 색상(`-[#...]`) 차단
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/-\\[#[0-9a-fA-F]/]",
          message: TOKEN_ONLY_MESSAGE,
        },
        {
          selector: "TemplateElement[value.raw=/-\\[#[0-9a-fA-F]/]",
          message: TOKEN_ONLY_MESSAGE,
        },
      ],
    },
  },
];

export default config;
