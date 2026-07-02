/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 외부 이미지는 도메인 화이트리스트만 허용 — security.md §6. 와일드카드 금지.
  images: {
    remotePatterns: [
      // 식약처 COOKRCP01 완성 요리 사진 (https 프록시 → 배포 https에서 mixed-content 없음)
      { protocol: "https", hostname: "www.foodsafetykorea.go.kr", pathname: "/uploadimg/**" },
    ],
  },
};

export default nextConfig;
