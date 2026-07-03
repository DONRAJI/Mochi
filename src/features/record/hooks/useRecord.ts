"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  markMealEaten,
  fetchStreak,
  fetchWeights,
  fetchTodayMeals,
  fetchProfile,
  saveProfile,
  fetchNudge,
  fetchDailyBudget,
  deleteMeal,
  addWeight,
} from "../api/record.api";
import { useMochiStore } from "@/store/mochi";
import type { MarkMealRequest, ProfileRequest } from "../types";

/** queryKey ["record","streak"] — 먹었어요 시 함께 갱신. */
export function useStreak() {
  return useQuery({ queryKey: ["record", "streak"], queryFn: fetchStreak, retry: false });
}

/** 오늘 먹은 끼니 — 먹었어요 시 ["record"] 무효화로 함께 갱신. */
export function useTodayMeals() {
  return useQuery({ queryKey: ["record", "today"], queryFn: fetchTodayMeals, retry: false });
}

/** 오늘의 kcal 예산(TDEE, detail 모드) — 프로필·모드·먹었어요 변경 시 ["record"] 무효화로 갱신. */
export function useDailyBudget() {
  return useQuery({ queryKey: ["record", "budget"], queryFn: fetchDailyBudget, retry: false });
}

/** 오늘 기록 삭제(#2) — 삭제 후 오늘 기록·예산 갱신. */
export function useDeleteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMeal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["record"] }),
  });
}

/** opt-in 개인 프로필 (PRD 11.4). */
export function useProfile() {
  return useQuery({ queryKey: ["record", "profile"], queryFn: fetchProfile, retry: false });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileRequest) => saveProfile(input),
    // 프로필(TDEE)이 바뀌면 넛지도 달라지므로 record 전체 무효화.
    onSuccess: () => qc.invalidateQueries({ queryKey: ["record"] }),
  });
}

/** 밸런싱 넛지 (PRD 11.5) — 먹었어요 시 ["record"] 무효화로 함께 갱신. */
export function useBalanceNudge() {
  return useQuery({ queryKey: ["record", "nudge"], queryFn: fetchNudge, retry: false });
}

export function useWeightLogs() {
  return useQuery({ queryKey: ["record", "weight"], queryFn: () => fetchWeights(), retry: false });
}

export function useAddWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weight: number) => addWeight(weight),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["record", "weight"] }),
  });
}

/** '먹었어요' — 성공 시 모찌가 즉시 cheer, 도감·모찌·스트릭 갱신. */
export function useMarkMealEaten() {
  const qc = useQueryClient();
  const setMochi = useMochiStore((s) => s.setState);
  return useMutation({
    mutationFn: (input: MarkMealRequest) => markMealEaten(input),
    onSuccess: () => {
      setMochi("cheer");
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["mochi"] });
      qc.invalidateQueries({ queryKey: ["record"] }); // 스트릭 갱신
    },
  });
}
