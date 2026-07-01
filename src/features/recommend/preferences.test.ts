import { describe, it, expect } from "vitest";
import {
  groupPreferences,
  hasAllergen,
  preferenceScore,
  ingredientMatcher,
  nameMatcher,
} from "./preferences";

describe("취향 반영 (선호·비선호·알러지)", () => {
  it("kind별로 태그를 묶는다", () => {
    const g = groupPreferences([
      { kind: "like", label: "닭가슴살" },
      { kind: "dislike", label: "오이" },
      { kind: "allergy", label: "새우" },
      { kind: "like", label: "두부" },
    ]);
    expect(g.likes).toEqual(["닭가슴살", "두부"]);
    expect(g.dislikes).toEqual(["오이"]);
    expect(g.allergies).toEqual(["새우"]);
  });

  it("알러지 재료가 든 요리는 제외 대상이다(재료 정확일치)", () => {
    const match = ingredientMatcher(["새우", "양파", "마늘"]);
    expect(hasAllergen(match, ["새우"])).toBe(true);
    expect(hasAllergen(match, ["땅콩"])).toBe(false);
  });

  it("선호는 +, 비선호는 - 점수", () => {
    const match = ingredientMatcher(["닭가슴살", "오이"]);
    const s = preferenceScore(match, ["닭가슴살"], ["오이"]);
    expect(s).toBe(12 - 20); // like 1 - dislike 1
  });

  it("이름 부분일치로도 매칭된다(외식·간편식)", () => {
    const match = nameMatcher("새우 볶음밥");
    expect(hasAllergen(match, ["새우"])).toBe(true);
    expect(hasAllergen(match, ["오징어"])).toBe(false);
  });

  it("취향이 없으면 점수 0·제외 없음", () => {
    const match = ingredientMatcher(["두부", "상추"]);
    expect(hasAllergen(match, [])).toBe(false);
    expect(preferenceScore(match, [], [])).toBe(0);
  });
});
