import { fetcher } from "@/lib/fetcher";
import type {
  MarkMealRequest,
  MealRecordResponse,
  StreakResponse,
  WeightLogResponse,
} from "../types";

export function markMealEaten(input: MarkMealRequest): Promise<MealRecordResponse> {
  return fetcher<MealRecordResponse>("/api/records/meals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchStreak(): Promise<StreakResponse> {
  return fetcher<StreakResponse>("/api/records/streak");
}

export function fetchWeights(): Promise<WeightLogResponse[]> {
  return fetcher<WeightLogResponse[]>("/api/records/weight");
}

export function addWeight(weight: number): Promise<WeightLogResponse> {
  return fetcher<WeightLogResponse>("/api/records/weight", {
    method: "POST",
    body: JSON.stringify({ weight }),
  });
}
