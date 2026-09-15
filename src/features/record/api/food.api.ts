import { fetcher } from "@/lib/fetcher";
import type { OutsidePlace } from "../outsidePlaces";
import type { FoodBrowseResponse, FoodSearchItem } from "../types";

/**
 * 음식 영양 사전 이름 검색 — 직접 입력 기록에서 칼로리 후보를 제안할 때.
 * kcal은 detail(관리) 모드일 때만 채워져 온다(서버가 결정, 불변 #2).
 */
export function searchFoods(q: string, size = 5): Promise<FoodSearchItem[]> {
  const params = new URLSearchParams({ q, size: String(size) });
  return fetcher<FoodSearchItem[]>(`/api/records/foods?${params}`);
}

/** '밖에서 먹기' 장소별 음식 목록 — 가벼운 순, 페이지. */
export function browseFoods(
  place: OutsidePlace,
  page: number,
  size: number,
): Promise<FoodBrowseResponse> {
  const params = new URLSearchParams({ place, page: String(page), size: String(size) });
  return fetcher<FoodBrowseResponse>(`/api/records/foods/browse?${params}`);
}
