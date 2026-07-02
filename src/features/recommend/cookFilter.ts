import type { RecommendationResponse } from "./types";

/** 요리 모드 정렬/필터 (PRD 5.3) — 순수 함수. null이면 전체. */
export function matchesCookFilter(r: RecommendationResponse, filter: string | null): boolean {
  switch (filter) {
    case "15분 이내":
      return r.minutes != null && r.minutes <= 15;
    case "추가구매 없음":
      return r.missingIngredients.length === 0;
    case "단백질 위주":
      return !!r.badge && r.badge.includes("단백질");
    case "가벼움":
      return !!r.badge && r.badge.includes("가벼움");
    default:
      return true;
  }
}
