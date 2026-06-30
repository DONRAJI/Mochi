"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRecommendations } from "../api/recommend.api";
import type { MealMode } from "../types";

export function useRecommendations(mode: MealMode) {
  return useQuery({
    queryKey: ["recommend", mode],
    queryFn: () => fetchRecommendations(mode),
  });
}
