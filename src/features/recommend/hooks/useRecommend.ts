"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchRecommendations,
  createRecipe,
  fetchFavorites,
  toggleFavorite,
} from "../api/recommend.api";
import type { CreateRecipeRequest, MealMode } from "../types";
import type { ToggleFavoriteRequest } from "../favorite";

export function useRecommendations(mode: MealMode) {
  return useQuery({
    queryKey: ["recommend", mode],
    queryFn: () => fetchRecommendations(mode),
  });
}

/** 즐겨찾기 목록 (#7). */
export function useFavorites() {
  return useQuery({ queryKey: ["favorites"], queryFn: fetchFavorites, retry: false });
}

/** 즐겨찾기 토글 — 성공 시 추천(플래그)·즐겨찾기 목록 갱신. */
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ToggleFavoriteRequest) => toggleFavorite(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recommend"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

/** 내 요리 등록 — 성공 시 요리 추천 목록 갱신(내 요리가 바로 뜬다). */
export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecipeRequest) => createRecipe(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommend", "cook"] }),
  });
}
