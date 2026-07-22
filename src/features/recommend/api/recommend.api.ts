import { fetcher } from "@/lib/fetcher";
import type {
  CreateRecipeRequest,
  CreateRecipeResponse,
  MealMode,
  RecommendationResponse,
} from "../types";
import type {
  ToggleFavoriteRequest,
  ToggleFavoriteResult,
  FavoriteResponse,
} from "../favorite";

/** 추천 목록 조회 (컴포넌트 → 이 함수 → TanStack Query 순, conventions.md).
 *  size=50: 외식·간편식(≤36)은 전량 받아 카테고리 내비를 클라에서 필터(#5). */
export function fetchRecommendations(mode: MealMode): Promise<RecommendationResponse[]> {
  return fetcher<RecommendationResponse[]>(`/api/recommend/meals?mode=${mode}&size=50`);
}

/** 레시피 검색(cook) — 요리 이름 부분일치(q) / 재료 상세검색(ingredients 쉼표구분). */
export function searchRecipes(q: string, ingredients: string[]): Promise<RecommendationResponse[]> {
  const params = new URLSearchParams({ mode: "cook", size: "50" });
  if (q.trim()) params.set("q", q.trim());
  if (ingredients.length) params.set("ingredients", ingredients.join(","));
  return fetcher<RecommendationResponse[]>(`/api/recommend/meals?${params.toString()}`);
}

/** 내 요리 등록 (PRD 11.3). */
export function createRecipe(input: CreateRecipeRequest): Promise<CreateRecipeResponse> {
  return fetcher<CreateRecipeResponse>("/api/recommend/recipes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** 즐겨찾기 목록 (#7). */
export function fetchFavorites(): Promise<FavoriteResponse[]> {
  return fetcher<FavoriteResponse[]>("/api/recommend/favorites");
}

/** 즐겨찾기 토글. */
export function toggleFavorite(input: ToggleFavoriteRequest): Promise<ToggleFavoriteResult> {
  return fetcher<ToggleFavoriteResult>("/api/recommend/favorites", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
