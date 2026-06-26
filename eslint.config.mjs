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
