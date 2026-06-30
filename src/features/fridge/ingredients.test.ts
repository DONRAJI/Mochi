import { describe, it, expect } from "vitest";
import { emojiForIngredient } from "./ingredients";
import { createIngredientSchema } from "./types";

describe("fridge", () => {
  it("알려진 재료는 매핑된 이모지를 준다", () => {
    expect(emojiForIngredient("계란")).toBe("🥚");
    expect(emojiForIngredient("두부")).toBe("🧈");
  });

  it("모르는 재료는 기본 이모지", () => {
    expect(emojiForIngredient("불닭볶음면")).toBe("🥗");
  });

  it("createIngredientSchema는 빈 이름을 거부하고 정상 입력을 통과시킨다", () => {
    expect(createIngredientSchema.safeParse({ name: "", category: "채소" }).success).toBe(false);
    expect(createIngredientSchema.safeParse({ name: "감자", category: "채소" }).success).toBe(true);
  });
});
