import { fetcher } from "@/lib/fetcher";
import type { CreateIngredientRequest, IngredientResponse } from "../types";

export function fetchIngredients(): Promise<IngredientResponse[]> {
  return fetcher<IngredientResponse[]>("/api/fridge/ingredients");
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
