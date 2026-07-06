"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as fridgeApi from "../api/fridge.api";
import type { CreateIngredientRequest, IngredientResponse } from "../types";

export const fridgeKey = ["fridge", "ingredients"] as const;

export function useIngredients() {
  return useQuery({ queryKey: fridgeKey, queryFn: fridgeApi.fetchIngredients, retry: false });
}

// ── 낙관적 업데이트 헬퍼 ──
// 재료 스티커는 캐시부터 바꿔 딜레이 없이 바로 뜨게 하고, 매칭률(recommend)은 서버 계산이라 settle 후 무효화.
async function snapshotFridge(qc: QueryClient) {
  await qc.cancelQueries({ queryKey: fridgeKey });
  return qc.getQueryData<IngredientResponse[]>(fridgeKey);
}
function patchFridge(qc: QueryClient, fn: (list: IngredientResponse[]) => IngredientResponse[]) {
  qc.setQueryData<IngredientResponse[]>(fridgeKey, (old) => (old ? fn(old) : old));
}
function settleFridge(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: fridgeKey }); // 실제 id·희귀도로 교체
  qc.invalidateQueries({ queryKey: ["recommend"] }); // 요리 매칭률 점등
}

export function useAddIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIngredientRequest) => fridgeApi.createIngredient(input),
    // 담자마자 스티커가 바로 보이게(딜레이 없이). 서버 응답 오면 실제 항목으로 교체.
    onMutate: async (input) => {
      const prev = await snapshotFridge(qc);
      const optimistic: IngredientResponse = {
        id: `temp-${Date.now()}-${input.name}`,
        name: input.name,
        category: input.category,
        rarity: "common",
        expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
      };
      patchFridge(qc, (list) => [...list, optimistic]);
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(fridgeKey, ctx.prev);
    },
    onSettled: () => settleFridge(qc),
  });
}

export function useRemoveIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fridgeApi.deleteIngredient(id),
    onMutate: async (id) => {
      const prev = await snapshotFridge(qc);
      patchFridge(qc, (list) => list.filter((i) => i.id !== id));
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(fridgeKey, ctx.prev);
    },
    onSettled: () => settleFridge(qc),
  });
}
