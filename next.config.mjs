// Supabase Storage 서명 URL 호스트를 env에서 도출(하드코딩·와일드카드 회피).
const supabaseHost = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
