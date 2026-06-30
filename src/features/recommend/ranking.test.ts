import { describe, it, expect } from "vitest";
import { computeMatchRate, missingIngredients } from "./ranking";

describe("recommend 매칭률", () => {
  it("가진 재료 비율로 매칭률을 낸다", () => {
    expect(computeMatchRate(["계란", "우유"], ["계란", "우유", "버터"])).toBe(67);
  });

  it("빈 냉장고는 0%", () => {
    expect(computeMatchRate([], ["두부", "김치"])).toBe(0);
  });

  it("필요 재료가 없으면 0%", () => {
    expect(computeMatchRate(["두부"], [])).toBe(0);
  });

  it("부족한 재료만 추려낸다", () => {
    expect(missingIngredients(["두부"], ["두부", "김치", "대파"])).toEqual(["김치", "대파"]);
  });
});
