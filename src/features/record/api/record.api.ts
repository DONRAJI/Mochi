import { fetcher } from "@/lib/fetcher";
import type { Nudge } from "../balance";
import type {
  MarkMealRequest,
  MealRecordResponse,
  ProfileRequest,
  ProfileResponse,
  StreakResponse,
  TodayMealResponse,
  WeightLogResponse,
  DailyBudgetResponse,
} from "../types";

export function fetchTodayMeals(): Promise<TodayMealResponse[]> {
  return fetcher<TodayMealResponse[]>("/api/records/today");
}

export function deleteMeal(id: string): Promise<{ done: true }> {
  return fetcher<{ done: true }>(`/api/records/meals/${id}`, { method: "DELETE" });
}

export function fetchDailyBudget(): Promise<DailyBudgetResponse> {
  return fetcher<DailyBudgetResponse>("/api/records/budget");
}

export function fetchNudge(): Promise<Nudge> {
  return fetcher<Nudge>("/api/records/nudge");
}

export function fetchProfile(): Promise<ProfileResponse> {
  return fetcher<ProfileResponse>("/api/records/profile");
}

export function saveProfile(input: ProfileRequest): Promise<ProfileResponse> {
  return fetcher<ProfileResponse>("/api/records/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

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
