import { fetcher } from "@/lib/fetcher";
import type { AddPlanRequest, PlannedMealResponse } from "../plan";
import type { MealRecordResponse } from "@/features/record/types";

export function fetchPlan(from: string, to: string): Promise<PlannedMealResponse[]> {
  return fetcher<PlannedMealResponse[]>(`/api/recommend/plan?from=${from}&to=${to}`);
}

export function addPlan(input: AddPlanRequest): Promise<PlannedMealResponse> {
  return fetcher<PlannedMealResponse>("/api/recommend/plan", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function removePlan(id: string): Promise<{ done: true }> {
  return fetcher<{ done: true }>(`/api/recommend/plan/${id}`, { method: "DELETE" });
}

export function eatPlan(id: string): Promise<MealRecordResponse> {
  return fetcher<MealRecordResponse>(`/api/recommend/plan/${id}/eat`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function autoFillWeek(dates: string[]): Promise<PlannedMealResponse[]> {
  return fetcher<PlannedMealResponse[]>("/api/recommend/plan/auto", {
    method: "POST",
    body: JSON.stringify({ dates }),
  });
}
