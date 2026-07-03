import { describe, it, expect } from "vitest";
import {
  soloFriendlyScore,
  commonIngredientRatio,
  buildIngredientFrequency,
} from "./soloFriendly";

describe("자취 현실성 점수", () => {
  const allCommon = { commonRatio: 1 };

  it("간단한 요리(재료 적고·단계 짧고·빨리)일수록 높다", () => {
    const simple = soloFriendlyScore({ ingredientCount: 3, stepCount: 3, minutes: 10, ...allCommon });
    const complex = soloFriendlyScore({ ingredientCount: 18, stepCount: 14, minutes: 60, ...allCommon });
    expect(simple).toBeGreaterThan(complex);
  });

  it("아주 간단+흔하면 만점, 아주 복잡+특수하면 0점", () => {
    expect(soloFriendlyScore({ ingredientCount: 4, stepCount: 3, minutes: 12, commonRatio: 1 })).toBe(24);
    expect(soloFriendlyScore({ ingredientCount: 20, stepCount: 15, minutes: 60, commonRatio: 0 })).toBe(0);
  });

  it("재료 수가 같아도 특수 재료(청국장 등)면 점수가 내려간다", () => {
    const common = soloFriendlyScore({ ingredientCount: 3, stepCount: 3, minutes: 10, commonRatio: 1 });
    const rare = soloFriendlyScore({ ingredientCount: 3, stepCount: 3, minutes: 10, commonRatio: 0 });
    expect(rare).toBeLessThan(common); // 재료 수는 같지만 흔함 비중에서 감점
  });

  it("매칭률(0~100)을 뒤엎지 않는 규모다 (≤24)", () => {
    expect(soloFriendlyScore({ ingredientCount: 1, stepCount: 1, minutes: 1, commonRatio: 1 })).toBeLessThanOrEqual(24);
  });
});

describe("흔한 재료 비율 (코퍼스 빈도)", () => {
  // 두부·계란은 여러 레시피에 등장(흔함), 청국장은 하나에만(특수).
  const recipes = [
    { ingredients: ["두부", "계란", "간장"] },
    { ingredients: ["두부", "계란", "파"] },
    { ingredients: ["두부", "김치"] },
    { ingredients: ["계란", "밥"] },
    { ingredients: ["청국장", "두부"] },
  ];
  const id = (s: string) => s; // 이 테스트는 정규화 항등
  const freq = buildIngredientFrequency(recipes, id);

  it("등장 빈도 집계", () => {
    expect(freq.get("두부")).toBe(4);
    expect(freq.get("계란")).toBe(3);
    expect(freq.get("청국장")).toBe(1);
  });

  it("흔한 재료로만 된 레시피는 비율 1", () => {
    // total=5 → threshold=max(3, 0.05)=3. 두부(4)·계란(3) 흔함
    expect(commonIngredientRatio(["두부", "계란"], freq, recipes.length)).toBe(1);
  });

  it("특수 재료가 섞이면 비율이 내려간다", () => {
    // 두부(흔함)·청국장(1<3, 특수) → 1/2
    expect(commonIngredientRatio(["두부", "청국장"], freq, recipes.length)).toBe(0.5);
  });

  it("재료 정보가 없으면 페널티 없음(1)", () => {
    expect(commonIngredientRatio([], freq, recipes.length)).toBe(1);
  });
});
