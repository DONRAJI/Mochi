"use client";

import { useQuery } from "@tanstack/react-query";
import { browseFoods } from "../api/food.api";
import type { OutsidePlace } from "../outsidePlaces";

/** 한 페이지 음식 수 — 추천 카드보다 작은 한 줄 카드라 조금 넉넉히. */
export const FOOD_BROWSE_PAGE_SIZE = 10;

/**
 * '밖에서 먹기' 장소별 음식 목록. 장소가 없으면(편의점 등 다른 목록을 보는 중) 조회하지 않는다.
 * 사전은 적재 때만 바뀌므로 오래 캐시한다.
 */
export function useFoodBrowse(place: OutsidePlace | null, page: number) {
  return useQuery({
    queryKey: ["foods", "browse", place, page],
    queryFn: () => browseFoods(place as OutsidePlace, page, FOOD_BROWSE_PAGE_SIZE),
    enabled: place != null,
    staleTime: 10 * 60_000,
  });
}
