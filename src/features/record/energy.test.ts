import { describe, it, expect } from "vitest";
import { computeBMR, computeTDEE, computeCalorieBudget, ageFromBirthYear } from "./energy";

describe("에너지 계산 (opt-in 개인화)", () => {
  it("Mifflin-St Jeor BMR (여성 예시)", () => {
    // 60kg, 165cm, 30세, 여성 → 10*60 + 6.25*165 - 5*30 - 161 = 1320.25 → 1320
    expect(computeBMR(60, 165, 30, "female")).toBe(1320);
  });

  it("남성은 여성보다 BMR이 높다", () => {
    const f = computeBMR(70, 175, 30, "female");
    const m = computeBMR(70, 175, 30, "male");
    expect(m).toBeGreaterThan(f);
  });

  it("활동량이 높을수록 TDEE가 크다", () => {
    const bmr = 1400;
    expect(computeTDEE(bmr, "high")).toBeGreaterThan(computeTDEE(bmr, "low"));
  });

  it("생년 → 나이", () => {
    expect(ageFromBirthYear(2000, new Date("2026-07-01"))).toBe(26);
  });

  it("감량 예산 = 유지(TDEE) − 500", () => {
    expect(computeCalorieBudget(2359, "male")).toBe(1859);
    expect(computeCalorieBudget(2000, "female")).toBe(1500);
  });

  it("체중이 많이 나가도 −500이 BMR 하한에 막히지 않는다 (예전 방식이 막히던 사례)", () => {
    // 남 26세 181cm 96kg 좌식 — 예전엔 max(BMR 1966, 2359×0.85=2005) = 2005였다
    const bmr = computeBMR(96, 181, 26, "male");
    const tdee = computeTDEE(bmr, "low");
    expect(bmr).toBe(1966);
    expect(tdee).toBe(2359);
    expect(computeCalorieBudget(tdee, "male")).toBe(1859);
  });

  it("최소 섭취량 아래로는 내리지 않는다 — 남 1,500 / 여 1,200", () => {
    expect(computeCalorieBudget(1800, "male")).toBe(1500); // 1300 → 1500
    expect(computeCalorieBudget(1547, "female")).toBe(1200); // 1047 → 1200
  });

  it("성별 '기타'는 보수적으로 1,500을 하한으로", () => {
    expect(computeCalorieBudget(1800, "other")).toBe(1500);
  });

  it("유지 칼로리보다 높은 목표는 주지 않는다 — 하한이 TDEE보다 크면 TDEE가 목표", () => {
    // 여성 하한 1,200인데 유지가 1,100이면 1,200은 '더 먹으라'는 목표가 된다
    expect(computeCalorieBudget(1100, "female")).toBe(1100);
  });

  it("어떤 경우에도 예산은 유지 칼로리를 넘지 않는다", () => {
    for (const g of ["male", "female", "other"] as const) {
      for (const tdee of [900, 1200, 1500, 1800, 2359, 3200]) {
        expect(computeCalorieBudget(tdee, g)).toBeLessThanOrEqual(tdee);
      }
    }
  });
});
