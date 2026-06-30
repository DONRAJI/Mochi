"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { markMealEaten, fetchStreak, fetchWeights, addWeight } from "../api/record.api";
import { useMochiStore } from "@/store/mochi";
import type { MarkMealRequest } from "../types";

/** queryKey ["record","streak"] — 먹었어요 시 함께 갱신. */
export function useStreak() {
  return useQuery({ queryKey: ["record", "streak"], queryFn: fetchStreak, retry: false });
}

export function useWeightLogs() {
  return useQuery({ queryKey: ["record", "weight"], queryFn: fetchWeights, retry: false });
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
