// Supabase Storage 서명 URL 호스트를 env에서 도출(하드코딩·와일드카드 회피).
const supabaseHost = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : null;

/**
 * 보안 응답 헤더 (security.md — 산문 대신 실제 장치로 강제).
 *
 * CSP는 클릭재킹·주입 계열만 막고 script-src/style-src/default-src는 **일부러 넣지 않았다**:
 * Next의 하이드레이션 인라인 스크립트와 Framer Motion 인라인 스타일을 막아 화면이 깨질 수
 * 있는데, 실기기 검증 없이 배포하면 위험하다. 아래 네 지시어는 렌더링에 영향이 없어 안전하다.
 * (script-src까지 조이려면 미들웨어 nonce가 필요 — 별도 작업.)
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" }, // MIME 스니핑 차단
  { key: "X-Frame-Options", value: "DENY" }, // 구형 브라우저용 클릭재킹 방어(TWA는 iframe 아님)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, // 외부로 경로 유출 방지
  // 쓰지 않는 강력한 기능은 원천 차단. 사진 기록은 <input capture>(파일 선택기)라 영향 없음.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'", // 다른 사이트가 우리 화면을 감싸지 못하게
      "base-uri 'self'", // <base> 주입으로 상대경로를 탈취하지 못하게
      "form-action 'self'", // 폼 전송이 외부로 새지 않게
      "object-src 'none'", // 플러그인 임베드 차단
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // 외부 이미지는 도메인 화이트리스트만 허용 — security.md §6. 와일드카드 금지.
  images: {
    remotePatterns: [
      // 식약처 COOKRCP01 완성 요리 사진 (https 프록시 → 배포 https에서 mixed-content 없음)
      { protocol: "https", hostname: "www.foodsafetykorea.go.kr", pathname: "/uploadimg/**" },
      // 식사 사진(비공개 버킷 서명 URL) — 프로젝트 호스트만, 서명 경로만.
      ...(supabaseHost
        ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/sign/**" }]
        : []),
    ],
  },
};

export default nextConfig;
