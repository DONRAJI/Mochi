import { fetcher } from "@/lib/fetcher";
import type {
  CreateRecipeRequest,
  CreateRecipeResponse,
  MealMode,
  RecommendationResponse,
} from "../types";

/** 추천 목록 조회 (컴포넌트 → 이 함수 → TanStack Query 순, conventions.md). */
export function fetchRecommendations(mode: MealMode): Promise<RecommendationResponse[]> {
  return fetcher<RecommendationResponse[]>(`/api/recommend/meals?mode=${mode}`);
}

/** 내 요리 등록 (PRD 11.3). */
export function createRecipe(input: CreateRecipeRequest): Promise<CreateRecipeResponse> {
  return fetcher<CreateRecipeResponse>("/api/recommend/recipes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
