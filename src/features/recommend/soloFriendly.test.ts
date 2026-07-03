import { describe, it, expect } from "vitest";
import { soloFriendlyScore } from "./soloFriendly";

describe("자취 현실성 점수", () => {
  it("간단한 요리(재료 적고·단계 짧고·빨리)일수록 높다", () => {
    const simple = soloFriendlyScore({ ingredientCount: 3, stepCount: 3, minutes: 10 });
    const complex = soloFriendlyScore({ ingredientCount: 18, stepCount: 14, minutes: 60 });
    expect(simple).toBeGreaterThan(complex);
  });

  it("아주 간단하면 만점, 아주 복잡하면 0점", () => {
    expect(soloFriendlyScore({ ingredientCount: 4, stepCount: 3, minutes: 12 })).toBe(24);
    expect(soloFriendlyScore({ ingredientCount: 20, stepCount: 15, minutes: 60 })).toBe(0);
  });

  it("매칭률(0~100)을 뒤엎지 않는 규모다 (≤24)", () => {
    expect(soloFriendlyScore({ ingredientCount: 1, stepCount: 1, minutes: 1 })).toBeLessThanOrEqual(24);
  });

  it("재료 하나만 많아도 점수가 내려간다", () => {
    const few = soloFriendlyScore({ ingredientCount: 5, stepCount: 4, minutes: 15 });
    const many = soloFriendlyScore({ ingredientCount: 15, stepCount: 4, minutes: 15 });
    expect(many).toBeLessThan(few);
  });
});
