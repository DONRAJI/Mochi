import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "./types";

describe("auth Zod 스키마", () => {
  it("정상 회원가입 입력을 통과시킨다", () => {
    const r = signupSchema.safeParse({
      email: "mochi@example.com",
      password: "12345678",
      nickname: "모찌",
      cooksOften: true,
    });
    expect(r.success).toBe(true);
  });

  it("8자 미만 비밀번호를 거부한다", () => {
    const r = signupSchema.safeParse({
      email: "mochi@example.com",
      password: "123",
      nickname: "모찌",
      cooksOften: true,
    });
    expect(r.success).toBe(false);
  });

  it("이메일 형식이 아니면 로그인 입력을 거부한다", () => {
    const r = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(r.success).toBe(false);
  });
});
