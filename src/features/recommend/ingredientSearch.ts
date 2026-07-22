/**
 * 레시피 검색 정규화 (순수 함수) — 이름·재료 검색을 지저분한 원문에도 통하게 한다.
 *
 * 재료 원문엔 잡음이 있다: 복합("?멸치&다시마육수", "청양고추 & 풋고추"), 공백("순 두부",
 * "닭 가슴살", "다시마 육수"), 수식어("다진 마늘"). 검색 시 레시피 재료와 검색어를 **같은 방식**
 * 으로 정규화(분리 + canonicalize=공백/수식어 정리)하면 기존 데이터로도 매칭된다.
 */
import { canonicalize } from "@/features/fridge/canonical";

/** 한 원문 재료를 조각들로 — 앞의 ? 제거 + ?·&·/ 로 복합 재료 분리("멸치&다시마육수"→멸치, 다시마육수). */
export function explodeIngredient(raw: string): string[] {
  return raw
    .replace(/^\?+/, "")
    .split(/[?&/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 레시피의 모든 재료를 검색 토큰 집합으로(분리 + canonicalize 정규화). */
export function recipeSearchTokens(ingredients: string[], canon: Map<string, string>): string[] {
  const set = new Set<string>();
  for (const raw of ingredients) {
    for (const part of explodeIngredient(raw)) {
      const c = canonicalize(part, canon);
      if (c) set.add(c);
    }
  }
  return [...set];
}

/** 재료 검색어를 레시피 토큰과 같은 방식으로 정규화(공백·수식어 정리). */
export function normalizeQueryIngredient(q: string, canon: Map<string, string>): string {
  return canonicalize(q.trim(), canon);
}

/** 요리 이름 부분일치 — 공백·대소문자 무시. "알리오"→"알리오올리오볶음밥" 매칭. */
export function nameMatches(name: string, q: string): boolean {
  const query = q.replace(/\s+/g, "").toLowerCase();
  if (!query) return false;
  return name.replace(/\s+/g, "").toLowerCase().includes(query);
}

/**
 * 레시피가 검색 재료들을 (전부) 포함하는지 — 부분일치.
 * 검색어 "두부"는 레시피 토큰 순두부·연두부·두부에 다 매칭(AND 조건: 모든 검색어를 포함).
 */
export function ingredientsMatch(recipeTokens: string[], queryTerms: string[]): boolean {
  if (queryTerms.length === 0) return true;
  return queryTerms.every((term) => term.length > 0 && recipeTokens.some((t) => t.includes(term)));
}
