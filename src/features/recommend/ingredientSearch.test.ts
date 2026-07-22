import { describe, it, expect } from "vitest";
import { buildCanonicalMap } from "@/features/fridge/canonical";
import {
  explodeIngredient,
  recipeSearchTokens,
  normalizeQueryIngredient,
  nameMatches,
  ingredientsMatch,
} from "./ingredientSearch";

const canon = buildCanonicalMap([{ name: "닭가슴살", aliases: [] }]);

describe("ingredientSearch — 복합 재료 분리", () => {
  it("? 접두 제거 + &·/ 로 분리한다", () => {
    expect(explodeIngredient("?멸치&다시마육수")).toEqual(["멸치", "다시마육수"]);
    expect(explodeIngredient("청양고추 & 풋고추")).toEqual(["청양고추", "풋고추"]);
    expect(explodeIngredient("?부추")).toEqual(["부추"]);
    expect(explodeIngredient("소고기/돼지고기")).toEqual(["소고기", "돼지고기"]);
  });
});

describe("ingredientSearch — 정규화 토큰", () => {
  it("공백·수식어를 정리해 검색 토큰으로", () => {
    const tokens = recipeSearchTokens(["순 두부", "다진 마늘", "?멸치&다시마육수", "닭 가슴살"], canon);
    expect(tokens).toContain("순두부");
    expect(tokens).toContain("마늘"); // 수식어 '다진' 제거
    expect(tokens).toContain("멸치");
    expect(tokens).toContain("다시마육수");
    expect(tokens).toContain("닭가슴살");
  });
});

describe("ingredientSearch — 이름 부분일치", () => {
  it("일부만 입력해도 매칭(공백·대소문자 무시)", () => {
    expect(nameMatches("알리오올리오볶음밥", "알리오")).toBe(true);
    expect(nameMatches("알리오 올리오", "알리오올리오")).toBe(true);
    expect(nameMatches("김치찌개", "된장")).toBe(false);
    expect(nameMatches("김치찌개", "")).toBe(false);
  });
});

describe("ingredientSearch — 재료 매칭", () => {
  const tokens = recipeSearchTokens(["순 두부", "김치", "계란"], canon);
  it("검색어를 부분일치로 포함하면 매칭(모든 검색어 AND)", () => {
    expect(ingredientsMatch(tokens, [normalizeQueryIngredient("두부", canon)])).toBe(true); // 순두부에 부분일치
    expect(ingredientsMatch(tokens, ["김치", "계란"])).toBe(true);
    expect(ingredientsMatch(tokens, ["김치", "고등어"])).toBe(false); // 하나라도 없으면 제외
  });
  it("검색어 없으면 통과", () => {
    expect(ingredientsMatch(tokens, [])).toBe(true);
  });
});
