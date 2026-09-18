import { NextResponse, type NextRequest } from "next/server";

/**
 * 보호 라우트 인증 검사 (security.md §2·§7 — 라우터 레벨 1차 방어).
 * 진짜 검증은 각 Route Handler/서비스에서 재확인하는 다층 방어를 따른다.
 *
 * auth 구현 완료 → 가드 활성화. cookie 부재 시 /login 리다이렉트(1차 방어),
 * 진짜 검증은 각 Route Handler/서비스에서 재확인(다층 방어, security.md §2).
 */
const SESSION_COOKIE = "mochi_session";
const GUARD_ENABLED = true;

/**
 * 이미 로그인한 사람에게 보여줄 이유가 없는 화면 — 뒤로가기·북마크로 들어오면 홈으로 돌린다.
 * 메일 링크로 여는 화면(인증·비밀번호 재설정)은 로그인 상태에서도 열려야 하므로 넣지 않는다.
 */
const AUTH_PATHS = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  if (!GUARD_ENABLED) return NextResponse.next();

  const hasSession = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  // 가입·로그인 직후 뒤로가기로 로그인 폼이 다시 떠 "로그아웃된 것 같다"는 오해를 준 문제(2026-09-18).
  // 화면 쪽도 replace로 히스토리를 남기지 않지만, 앱 재진입·북마크까지 여기서 막는다.
  if (hasSession && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!hasSession && !AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // (main) 보호 라우트 + 로그인 상태에서 되돌릴 인증 화면. 정적 파일·이미지·공개 API는 제외.
  matcher: [
    "/",
    "/fridge/:path*",
    "/meals/:path*",
    "/collection/:path*",
    "/me/:path*",
    "/login",
    "/signup",
  ],
};
