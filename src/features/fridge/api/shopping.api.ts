import { fetcher } from "@/lib/fetcher";
import type { ShoppingItemResponse } from "../shopping";

export function fetchShopping(): Promise<ShoppingItemResponse[]> {
  return fetcher<ShoppingItemResponse[]>("/api/fridge/shopping");
}

export function addShopping(names: string[]): Promise<ShoppingItemResponse[]> {
  return fetcher<ShoppingItemResponse[]>("/api/fridge/shopping", {
    method: "POST",
    body: JSON.stringify({ names }),
  });
}

export function toggleShopping(id: string): Promise<{ done: true }> {
  return fetcher<{ done: true }>(`/api/fridge/shopping/${id}`, { method: "PATCH" });
}

export function removeShopping(id: string): Promise<{ done: true }> {
  return fetcher<{ done: true }>(`/api/fridge/shopping/${id}`, { method: "DELETE" });
}

export function moveCheckedToFridge(): Promise<ShoppingItemResponse[]> {
  return fetcher<ShoppingItemResponse[]>("/api/fridge/shopping/move", { method: "POST" });
}
