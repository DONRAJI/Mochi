import { describe, it, expect } from "vitest";
import { daysUntil, isExpiringSoon, expiryBonus } from "./expiry";

const NOW = new Date("2026-07-02T00:00:00Z");

describe("유통기한 유틸 (임박 우선 추천)", () => {
  it("남은 일수 계산(음수=지남)", () => {
    expect(daysUntil("2026-07-05T00:00:00Z", NOW)).toBe(3);
    expect(daysUntil("2026-07-01T00:00:00Z", NOW)).toBe(-1);
    expect(daysUntil(null, NOW)).toBeNull();
  });

  it("3일 이내(지난 것 포함)면 임박", () => {
    expect(isExpiringSoon("2026-07-04T00:00:00Z", NOW)).toBe(true);
    expect(isExpiringSoon("2026-07-01T00:00:00Z", NOW)).toBe(true); // 지남도 임박
    expect(isExpiringSoon("2026-07-20T00:00:00Z", NOW)).toBe(false);
    expect(isExpiringSoon(null, NOW)).toBe(false);
  });

  it("임박 재료를 쓰는 레시피에 보너스(캡 2)", () => {
    const soon = new Set(["두부", "대파", "계란"]);
    expect(expiryBonus(["두부", "김치"], soon)).toBe(15);
    expect(expiryBonus(["두부", "대파", "계란"], soon)).toBe(30); // 캡 2
    expect(expiryBonus(["김치"], soon)).toBe(0);
  });
});
