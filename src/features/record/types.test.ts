import { describe, it, expect } from "vitest";
import { markMealSchema, foodSearchQuerySchema } from "./types";

describe("기록 요청 검증", () => {
  it("음식 사전에서 고른 항목(foodId)으로 기록할 수 있다", () => {
    const parsed = markMealSchema.safeParse({ mode: "eatout", foodId: "mfds-D306-266000000-0001" });
    expect(parsed.success).toBe(true);
  });

  it("직접 적은 이름만 있어도 된다", () => {
    expect(markMealSchema.safeParse({ mode: "eatout", title: "추러스" }).success).toBe(true);
  });

  it("무엇을 먹었는지 하나도 없으면 받지 않는다 — '오늘의 기록'에 이름이 안 뜨는 기록이 된다", () => {
    expect(markMealSchema.safeParse({ mode: "eatout" }).success).toBe(false);
  });
});

describe("음식 사전 검색 쿼리", () => {
  it("한 글자는 받지 않는다 — 너무 많이 걸린다", () => {
    expect(foodSearchQuerySchema.safeParse({ q: "밥" }).success).toBe(false);
  });

  it("기본 5개, 최대 10개까지만", () => {
    const parsed = foodSearchQuerySchema.safeParse({ q: "비빔밥" });
    expect(parsed.success && parsed.data.size).toBe(5);
    expect(foodSearchQuerySchema.safeParse({ q: "비빔밥", size: "50" }).success).toBe(false);
  });
});
