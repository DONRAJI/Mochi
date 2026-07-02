"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as planApi from "../api/plan.api";
import { weekDates } from "../week";
import type { AddPlanRequest } from "../plan";
import { useMochiStore } from "@/store/mochi";

/** 이번 주(월~일) 계획. queryKey에 from/to를 넣어 주가 바뀌면 자동 갱신. */
export function usePlanWeek() {
  const week = weekDates(new Date());
  const from = week[0];
  const to = week[6];
  return useQuery({
    queryKey: ["plan", from, to],
    queryFn: () => planApi.fetchPlan(from, to),
    retry: false,
  });
}

export function useAddPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddPlanRequest) => planApi.addPlan(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan"] }),
  });
}

export function useRemovePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planApi.removePlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan"] }),
  });
}

/** 계획한 끼니 '먹었어요' — 기록 루프(스트릭·도감·모찌)로 이어진다. */
export function useEatPlan() {
  const qc = useQueryClient();
  const setMochi = useMochiStore((s) => s.setState);
  return useMutation({
    mutationFn: (id: string) => planApi.eatPlan(id),
    onSuccess: () => {
      setMochi("cheer");
      qc.invalidateQueries({ queryKey: ["plan"] });
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["mochi"] });
      qc.invalidateQueries({ queryKey: ["record"] });
    },
  });
}
