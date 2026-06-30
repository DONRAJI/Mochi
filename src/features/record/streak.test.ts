import { describe, it, expect } from "vitest";
import { nextStreakCount } from "./streak";

const d = (s: string) => new Date(s);

describe("streak", () => {
  it("첫 기록은 1", () => {
    expect(nextStreakCount(0, d("2026-06-30T00:00:00"), d("2026-06-30T10:00:00"))).toBe(1);
  });
  it("같은 날 추가 기록은 유지", () => {
    expect(nextStreakCount(3, d("2026-06-30T08:00:00"), d("2026-06-30T20:00:00"))).toBe(3);
  });
  it("다음 날 기록은 +1", () => {
    expect(nextStreakCount(3, d("2026-06-29T20:00:00"), d("2026-06-30T09:00:00"))).toBe(4);
  });
  it("여러 날 빠져도 끊지 않고 +1 (죄책감 제로)", () => {
    expect(nextStreakCount(5, d("2026-06-25T10:00:00"), d("2026-06-30T10:00:00"))).toBe(6);
  });
});
