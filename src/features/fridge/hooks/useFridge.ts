"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as fridgeApi from "../api/fridge.api";
import type { CreateIngredientRequest } from "../types";

export const fridgeKey = ["fridge", "ingredients"] as const;

export function useIngredients() {
  return useQuery({ queryKey: fridgeKey, queryFn: fridgeApi.fetchIngredients, retry: false });
}

/** 재료 변경 시 fridge + recommend 쿼리를 함께 무효화 → 요리 매칭률이 즉시 점등된다. */
function useInvalidateFridgeAndRecommend() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: fridgeKey });
    qc.invalidateQueries({ queryKey: ["recommend"] });
  };
}

export function useAddIngredient() {
  const invalidate = useInvalidateFridgeAndRecommend();
  return useMutation({
    mutationFn: (input: CreateIngredientRequest) => fridgeApi.createIngredient(input),
    onSuccess: invalidate,
  });
}

export function useRemoveIngredient() {
  const invalidate = useInvalidateFridgeAndRecommend();
  return useMutation({
    mutationFn: (id: string) => fridgeApi.deleteIngredient(id),
    onSuccess: invalidate,
  });
}
