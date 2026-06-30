import { fetcher } from "@/lib/fetcher";
import type { MarkMealRequest, MealRecordResponse, StreakResponse } from "../types";

export function markMealEaten(input: MarkMealRequest): Promise<MealRecordResponse> {
  return fetcher<MealRecordResponse>("/api/records/meals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchStreak(): Promise<StreakResponse> {
  return fetcher<StreakResponse>("/api/records/streak");
}
