import { fetcher } from "@/lib/fetcher";
import type { MealMode, RecommendationResponse } from "../types";

/** 추천 목록 조회 (컴포넌트 → 이 함수 → TanStack Query 순, conventions.md). */
export function fetchRecommendations(mode: MealMode): Promise<RecommendationResponse[]> {
  return fetcher<RecommendationResponse[]>(`/api/recommend/meals?mode=${mode}`);
}
