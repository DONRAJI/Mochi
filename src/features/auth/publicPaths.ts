/**
 * 세션이 풀렸을 때 로그인 화면으로 되돌려보내면 **안 되는** 경로.
 *
 * 로그인·가입 자신에서 401이 났다고 다시 /login으로 보내면 되돌이 이동이 되고,
 * /privacy·/account-deletion은 비로그인도 봐야 하는 공개 페이지다(플레이 심사 필수).
 * 순수 함수로 빼서 테스트한다 — 이동 루프는 눈으로 잡기 어려운 종류의 버그다.
 */
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/privacy",
  "/account-deletion",
  // 메일 링크로 들어오는 곳 — 로그인 없이 열리는 게 정상이다(다른 기기에서 메일을 열 수 있다).
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
