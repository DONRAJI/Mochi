import { describe, it, expect } from "vitest";
import { advanceStreak, dayGap } from "./streak";

const d = (s: string) => new Date(s);

describe("streak + 보호권 (#9)", () => {
  it("첫 기록은 1", () => {
    const r = advanceStreak({ count: 0, shieldCount: 1 }, d("2026-06-30T00:00:00"), d("2026-06-30T10:00:00"));
    expect(r.count).toBe(1);
  });

  it("같은 날 추가 기록은 유지", () => {
    const r = advanceStreak({ count: 3, shieldCount: 1 }, d("2026-06-30T08:00:00"), d("2026-06-30T20:00:00"));
    expect(r.count).toBe(3);
    expect(r.shieldUsed).toBe(false);
  });

  it("다음 날 기록은 +1", () => {
    const r = advanceStreak({ count: 3, shieldCount: 1 }, d("2026-06-29T20:00:00"), d("2026-06-30T09:00:00"));
    expect(r.count).toBe(4);
    expect(r.shieldUsed).toBe(false);
  });

  it("하루 빠져도 보호권이 있으면 이어가고 보호권 소진", () => {
    const r = advanceStreak({ count: 5, shieldCount: 1 }, d("2026-06-28T10:00:00"), d("2026-06-30T10:00:00"));
    expect(r.count).toBe(6);
    expect(r.shieldCount).toBe(0);
    expect(r.shieldUsed).toBe(true);
  });

  it("보호권 없이 빠지면 오늘의 1부터 새 시작(0 아님)", () => {
    const r = advanceStreak({ count: 5, shieldCount: 0 }, d("2026-06-25T10:00:00"), d("2026-06-30T10:00:00"));
    expect(r.count).toBe(1);
    expect(r.shieldUsed).toBe(false);
  });

  it("연속 7일 도달 시 보호권 +1 (최대 3)", () => {
    const r = advanceStreak({ count: 6, shieldCount: 1 }, d("2026-06-29T10:00:00"), d("2026-06-30T10:00:00"));
    expect(r.count).toBe(7);
    expect(r.shieldCount).toBe(2);
    // 최대 3 캡
    const capped = advanceStreak({ count: 13, shieldCount: 3 }, d("2026-06-29T10:00:00"), d("2026-06-30T10:00:00"));
    expect(capped.count).toBe(14);
    expect(capped.shieldCount).toBe(3);
  });

  it("dayGap: 같은 날 0, 어제 1, 여러 날 ≥2", () => {
    expect(dayGap(d("2026-06-30T01:00:00"), d("2026-06-30T23:00:00"))).toBe(0);
    expect(dayGap(d("2026-06-29T23:00:00"), d("2026-06-30T01:00:00"))).toBe(1);
    expect(dayGap(d("2026-06-25T10:00:00"), d("2026-06-30T10:00:00"))).toBe(5);
  });
});
