"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
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

// ── 낙관적 업데이트 헬퍼 (담기·삭제·먹었어요·이동 공용) ──
// 서버 왕복을 기다리지 않고 캐시부터 바꿔 화면이 즉시 반응하게 한다(conventions.md).
type PlanSnapshot = [QueryKey, PlannedMealResponse[] | undefined][];

/** 진행 중 조회를 멈추고 현재 캐시를 스냅샷(실패 시 복구용). */
async function snapshotPlan(qc: QueryClient): Promise<PlanSnapshot> {
  await qc.cancelQueries({ queryKey: ["plan"] });
  return qc.getQueriesData<PlannedMealResponse[]>({ queryKey: ["plan"] });
}
/** 캐시의 모든 주간 계획 목록에 updater 적용. */
function patchPlan(qc: QueryClient, fn: (list: PlannedMealResponse[]) => PlannedMealResponse[]) {
  qc.setQueriesData<PlannedMealResponse[]>({ queryKey: ["plan"] }, (old) => (old ? fn(old) : old));
}
/** 실패 시 스냅샷으로 조용히 복구(죄책감 제로). */
function rollbackPlan(qc: QueryClient, prev: PlanSnapshot | undefined) {
  prev?.forEach(([key, data]) => qc.setQueryData(key, data));
}

// 냉장고와 같은 가드 — 진행 중 계획 작업이 여럿이면(연속 담기·이동 중 담기 등) 중간 refetch가
// 다른 낙관적 변경을 덮어써 무시되는 레이스가 생김 → 마지막 하나가 끝날 때만 무효화.
// 모든 계획 변경(add/remove/move/eat/autofill)이 이 키를 공유해 조율된다.
const planMutationKey = ["plan", "mutation"] as const;
function settlePlanIfLast(qc: QueryClient) {
  if (qc.isMutating({ mutationKey: planMutationKey }) > 1) return;
  qc.invalidateQueries({ queryKey: ["plan"] });
}

export function useAddPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: planMutationKey,
    mutationFn: (input: AddPlanRequest) => planApi.addPlan(input),
    onMutate: async (input) => {
      const prev = await snapshotPlan(qc);
      // 서버 id가 오기 전 임시 항목으로 즉시 표시(재조회 시 실제 항목으로 교체됨).
      const tempId = `temp-${Date.now()}`;
      const optimistic: PlannedMealResponse = {
        id: tempId,
        date: input.date,
        slot: input.slot ?? null,
        mode: input.mode,
        refId: input.refId ?? null,
        title: input.title,
        emoji: input.emoji ?? null,
        eaten: false,
      };
      patchPlan(qc, (list) => [...list, optimistic]);
      return { prev, tempId };
    },
    // 임시 id를 서버 실제 항목으로 교체 — 바로 이어서 이동/먹었어요/삭제해도 실제 id로 동작.
    onSuccess: (created, _input, ctx) => {
      patchPlan(qc, (list) => list.map((m) => (m.id === ctx?.tempId ? created : m)));
    },
    onError: (_e, _vars, ctx) => rollbackPlan(qc, ctx?.prev),
    onSettled: () => settlePlanIfLast(qc),
  });
}

/** 이번 주 자동 채우기 (PRD 4.3). 서버가 고른 레시피라 낙관적 예측은 생략(‘채우는 중…’). */
export function useAutoFillWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: planMutationKey, // 다른 계획 작업과 같은 그룹 — 진행 중이면 그쪽 마지막 settle이 refetch
    mutationFn: (dates: string[]) => planApi.autoFillWeek(dates),
    onSettled: () => settlePlanIfLast(qc),
  });
}

export function useRemovePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: planMutationKey,
    mutationFn: (id: string) => planApi.removePlan(id),
    onMutate: async (id) => {
      const prev = await snapshotPlan(qc);
      patchPlan(qc, (list) => list.filter((m) => m.id !== id));
      return { prev };
    },
    onError: (_e, _id, ctx) => rollbackPlan(qc, ctx?.prev),
    onSettled: () => settlePlanIfLast(qc),
  });
}

/** 계획 이동(드래그 재배치) — 다른 날짜/끼니로. 낙관적 업데이트로 즉시 반영. */
export function useMovePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: planMutationKey,
    mutationFn: ({ id, ...input }: { id: string } & MovePlanRequest) => planApi.movePlan(id, input),
    onMutate: async ({ id, date, slot }) => {
      const prev = await snapshotPlan(qc);
      patchPlan(qc, (list) =>
        list.map((m) => (m.id === id ? { ...m, date, ...(slot ? { slot } : {}) } : m)),
      );
      return { prev };
    },
    onError: (_e, _vars, ctx) => rollbackPlan(qc, ctx?.prev),
    onSettled: () => settlePlanIfLast(qc),
  });
}

/** 계획한 끼니 '먹었어요' — 기록 루프(스트릭·도감·모찌)로 이어진다. */
export function useEatPlan() {
  const qc = useQueryClient();
  const setMochi = useMochiStore((s) => s.setState);
  return useMutation({
    mutationKey: planMutationKey,
    mutationFn: (id: string) => planApi.eatPlan(id),
    // 캘린더에서 바로 '먹음 ✓'으로 보이게(취소선). 도감·모찌 등 다른 도메인은 성공 후 동기화.
    onMutate: async (id) => {
      const prev = await snapshotPlan(qc);
      patchPlan(qc, (list) => list.map((m) => (m.id === id ? { ...m, eaten: true } : m)));
      return { prev };
    },
    onError: (_e, _id, ctx) => rollbackPlan(qc, ctx?.prev),
    onSuccess: () => {
      setMochi("cheer");
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["mochi"] });
      qc.invalidateQueries({ queryKey: ["record"] });
    },
    onSettled: () => settlePlanIfLast(qc), // 계획(plan)은 가드로 — 다른 도메인은 위 onSuccess에서
  });
}
