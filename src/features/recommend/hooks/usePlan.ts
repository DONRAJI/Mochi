"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as planApi from "../api/plan.api";
import { weekDates } from "../week";
import type { AddPlanRequest, MovePlanRequest, PlannedMealResponse } from "../plan";
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

/** 이번 주 자동 채우기 (PRD 4.3). */
export function useAutoFillWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dates: string[]) => planApi.autoFillWeek(dates),
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

/** 계획 이동(드래그 재배치) — 다른 날짜/끼니로. 낙관적 업데이트로 화면이 즉시 반영된다. */
export function useMovePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & MovePlanRequest) => planApi.movePlan(id, input),
    // 서버 왕복(PATCH+재조회)을 기다리지 않고 캐시를 바로 바꿔 드래그가 즉시 옮겨 보이게(conventions.md).
    onMutate: async ({ id, date, slot }) => {
      await qc.cancelQueries({ queryKey: ["plan"] });
      const prev = qc.getQueriesData<PlannedMealResponse[]>({ queryKey: ["plan"] });
      qc.setQueriesData<PlannedMealResponse[]>({ queryKey: ["plan"] }, (old) =>
        old?.map((m) => (m.id === id ? { ...m, date, ...(slot ? { slot } : {}) } : m)),
      );
      return { prev };
    },
    // 실패하면 원래대로 되돌린다(죄책감 제로: 조용히 복구).
    onError: (_e, _vars, ctx) => {
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    // 서버와 최종 동기화.
    onSettled: () => qc.invalidateQueries({ queryKey: ["plan"] }),
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
