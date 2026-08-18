import { describe, it, expect } from "vitest";
import { isPublicPath } from "./publicPaths";

describe("세션 복구 예외 경로 (되돌이 이동 방지)", () => {
  it("로그인·가입에서는 다시 로그인으로 보내지 않는다", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/signup")).toBe(true);
  });

  it("공개 페이지(개인정보·계정 삭제 안내)도 예외다", () => {
    expect(isPublicPath("/privacy")).toBe(true);
    expect(isPublicPath("/account-deletion")).toBe(true);
  });

  it("메일 링크로 들어오는 곳은 로그인 없이 열려야 한다", () => {
    // 비밀번호를 잊은 사람은 로그인할 수 없다 — 여기서 /login으로 튕기면 복구가 영영 불가능.
    expect(isPublicPath("/forgot-password")).toBe(true);
    expect(isPublicPath("/reset-password")).toBe(true);
    expect(isPublicPath("/verify-email")).toBe(true);
  });

  it("보호 화면은 예외가 아니다 — 세션이 끝나면 로그인으로 안내한다", () => {
    for (const p of ["/", "/fridge", "/meals", "/collection", "/me", "/me/weight"]) {
      expect(isPublicPath(p)).toBe(false);
    }
  });

  it("앞부분만 같은 경로를 공개로 오인하지 않는다", () => {
    // 세그먼트 경계로 비교 — '/loginish'는 로그인 화면이 아니다.
    expect(isPublicPath("/loginish")).toBe(false);
    expect(isPublicPath("/privacy-policy")).toBe(false);
    // 하위 경로는 같은 화면 묶음이므로 예외로 인정.
    expect(isPublicPath("/privacy/terms")).toBe(true);
  });
});
