"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRecommendations, createRecipe } from "../api/recommend.api";
import type { CreateRecipeRequest, MealMode } from "../types";

export function useRecommendations(mode: MealMode) {
  return useQuery({
    queryKey: ["recommend", mode],
    queryFn: () => fetchRecommendations(mode),
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
