import { fetcher, FetchError } from "@/lib/fetcher";
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

/** 사진 한 장 기록(PRD 8-3) — multipart라 fetcher(JSON) 대신 직접 fetch. Content-Type은 브라우저가 설정. */
export async function recordPhoto(file: Blob, mode = "eatout"): Promise<MealRecordResponse> {
  const form = new FormData();
  form.append("photo", file, "meal.jpg");
  form.append("mode", mode);
  const res = await fetch("/api/records/photo", { method: "POST", body: form });
  const body = await res.json().catch(() => null);
  if (!body?.success) {
    throw new FetchError(
      body?.error?.code ?? "INTERNAL",
      body?.error?.message ?? "사진을 올리지 못했어요.",
      res.status,
    );
  }
  return body.data as MealRecordResponse;
}

export function fetchStreak(): Promise<StreakResponse> {
  return fetcher<StreakResponse>("/api/records/streak");
}

/** 월별/연도별 정리 뷰까지 그리려면 넉넉한 기록이 필요 — 최근 1년치를 한 번에. */
export function fetchWeights(size = 365): Promise<WeightLogResponse[]> {
  return fetcher<WeightLogResponse[]>(`/api/records/weight?size=${size}`);
}

export function addWeight(weight: number): Promise<WeightLogResponse> {
  return fetcher<WeightLogResponse>("/api/records/weight", {
    method: "POST",
    body: JSON.stringify({ weight }),
  });
}
