import { NextResponse, type NextRequest } from "next/server";

/**
 * 보호 라우트 인증 검사 (security.md §2·§7 — 라우터 레벨 1차 방어).
 * 진짜 검증은 각 Route Handler/서비스에서 재확인하는 다층 방어를 따른다.
 *
 * ⚠️ P0 골격: auth 도메인(세션 발급)이 아직 없어, 지금은 통과시킨다.
 *    auth 구현 후 아래 가드를 활성화한다 (cookie 부재 시 /login 리다이렉트).
 */
const SESSION_COOKIE = "mochi_session";
const GUARD_ENABLED = false; // auth 구현 후 true 로

export function middleware(request: NextRequest) {
  if (!GUARD_ENABLED) return NextResponse.next();

  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  // (main) 보호 라우트만. 정적 파일·이미지·인증/공개 API는 제외.
  matcher: ["/", "/fridge/:path*", "/meals/:path*", "/collection/:path*", "/me/:path*"],
};
