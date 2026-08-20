import { fetcher } from "@/lib/fetcher";
import type {
  PresetResponse,
  SavePresetRequest,
  ApplyPresetResult,
} from "../preset";
import type { AddPlanRequest, MovePlanRequest, PlannedMealResponse } from "../plan";
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

export function movePlan(id: string, input: MovePlanRequest): Promise<PlannedMealResponse> {
  return fetcher<PlannedMealResponse>(`/api/recommend/plan/${id}`, {
    method: "PATCH",
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

// ── 주간 프리셋 ──
export function fetchPresets(): Promise<PresetResponse[]> {
  return fetcher<PresetResponse[]>("/api/recommend/plan/presets");
}

export function savePreset(input: SavePresetRequest): Promise<PresetResponse> {
  return fetcher<PresetResponse>("/api/recommend/plan/presets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function applyPreset(id: string, dates: string[]): Promise<ApplyPresetResult> {
  return fetcher<ApplyPresetResult>(`/api/recommend/plan/presets/${id}/apply`, {
    method: "POST",
    body: JSON.stringify({ dates }),
  });
}

export function removePreset(id: string): Promise<{ done: true }> {
  return fetcher<{ done: true }>(`/api/recommend/plan/presets/${id}`, { method: "DELETE" });
}
