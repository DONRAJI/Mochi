import { describe, it, expect } from "vitest";
import { matchesCookFilter } from "./cookFilter";
import type { RecommendationResponse } from "./types";

const base: RecommendationResponse = {
  id: "r",
  name: "테스트",
  emoji: null,
  imageUrl: null,
  myPhotoUrl: null,
  kcal: null,
  badge: "💪 단백질",
  portion: "hearty",
  minutes: 10,
  servings: 1,
  matchRate: 100,
  missingIngredients: [],
  ingredients: [],
  mine: false,
  usesExpiring: false,
  favorited: false,
  hidden: false,
  subtitle: null,
  rarity: "common",
  steps: [],
};

describe("요리 필터 (PRD 5.3)", () => {
  it("null이면 전체 통과", () => {
    expect(matchesCookFilter(base, null)).toBe(true);
  });
  it("15분 이내", () => {
    expect(matchesCookFilter({ ...base, minutes: 10 }, "15분 이내")).toBe(true);
    expect(matchesCookFilter({ ...base, minutes: 30 }, "15분 이내")).toBe(false);
  });
  it("추가구매 없음", () => {
    expect(matchesCookFilter({ ...base, missingIngredients: [] }, "추가구매 없음")).toBe(true);
    expect(matchesCookFilter({ ...base, missingIngredients: ["두부"] }, "추가구매 없음")).toBe(
      false,
    );
  });
  it("단백질 위주는 뱃지로", () => {
    expect(matchesCookFilter({ ...base, badge: "💪 단백질" }, "단백질 위주")).toBe(true);
    expect(matchesCookFilter({ ...base, badge: null }, "단백질 위주")).toBe(false);
  });
  it("가볍게는 양감 라벨로 — 단백질 뱃지가 있어도 양감으로 판단", () => {
    expect(matchesCookFilter({ ...base, portion: "light" }, "가볍게")).toBe(true);
    expect(matchesCookFilter({ ...base, portion: "hearty" }, "가볍게")).toBe(false);
    expect(matchesCookFilter({ ...base, portion: null }, "가볍게")).toBe(false);
  });
});
