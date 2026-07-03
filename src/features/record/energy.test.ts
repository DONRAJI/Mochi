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

  it("감량 예산은 유지(TDEE)보다 적다 — 살 빠지려면 덜 먹어야 함", () => {
    const budget = computeCalorieBudget(2000, 1400);
    expect(budget).toBe(1700); // 2000*0.85
    expect(budget).toBeLessThan(2000);
  });

  it("감량 예산은 BMR 밑으로 내려가지 않는다 (건강 하한)", () => {
    // 1500*0.85=1275 < BMR 1400 → BMR로 하한
    expect(computeCalorieBudget(1500, 1400)).toBe(1400);
  });
});
