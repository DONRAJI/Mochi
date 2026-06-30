import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password (scrypt)", () => {
  it("해시 후 같은 비밀번호로 검증이 통과한다", async () => {
    const hash = await hashPassword("mochi-pass-1234");
    expect(await verifyPassword("mochi-pass-1234", hash)).toBe(true);
  });

  it("틀린 비밀번호는 통과하지 못한다", async () => {
    const hash = await hashPassword("mochi-pass-1234");
    expect(await verifyPassword("nope-nope", hash)).toBe(false);
  });

  it("같은 비밀번호여도 매번 다른 해시(솔트)다", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });

  it("형식이 깨진 저장값은 false", async () => {
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});
