/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 외부 이미지(사진 기록·도감 에셋)는 추후 도메인 화이트리스트로 추가 — security.md §6 참고
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
