import { fetcher } from "@/lib/fetcher";
import type { CreateIngredientRequest, IngredientResponse } from "../types";

export function fetchIngredients(): Promise<IngredientResponse[]> {
  // 한 번에 전부 — 예전 기본 50개라 51번째부터 화면·선반에서 안 보였다(추천은 전체를 봐서 어긋남).
  return fetcher<IngredientResponse[]>("/api/fridge/ingredients?size=300");
}

export function createIngredient(input: CreateIngredientRequest): Promise<IngredientResponse> {
  return fetcher<IngredientResponse>("/api/fridge/ingredients", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteIngredient(id: string): Promise<{ done: true }> {
  return fetcher<{ done: true }>(`/api/fridge/ingredients/${id}`, { method: "DELETE" });
}
