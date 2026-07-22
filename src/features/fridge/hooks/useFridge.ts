"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as fridgeApi from "../api/fridge.api";
import { makeTempCanceller } from "@/lib/optimistic-temp";
import type { CreateIngredientRequest, IngredientResponse } from "../types";

export const fridgeKey = ["fridge", "ingredients"] as const;
// 냉장고를 바꾸는 작업 공통 mutation 키 — '진행 중인 냉장고 작업 수'를 센다(아래 settleFridgeIfLast).
// add/remove뿐 아니라 장보기→냉장고 이동(useMoveCheckedToFridge)도 이 키를 공유해 같은 가드를 받는다.
export const fridgeMutationKey = ["fridge", "mutation"] as const;
// 서버 id 오기 전 임시 재료를 지운 경우 추적(재생성 방지).
const fridgeTemp = makeTempCanceller();

export function useIngredients() {
  return useQuery({ queryKey: fridgeKey, queryFn: fridgeApi.fetchIngredients, retry: false });
}

// ── 낙관적 업데이트 헬퍼 ──
// 재료 스티커는 캐시부터 바꿔 딜레이 없이 바로 뜨게 하고, 매칭률(recommend)은 서버 계산이라 settle 후 무효화.
async function snapshotFridge(qc: QueryClient) {
  await qc.cancelQueries({ queryKey: fridgeKey });
  return qc.getQueryData<IngredientResponse[]>(fridgeKey);
}
function patchFridge(qc: QueryClient, fn: (list: IngredientResponse[]) => IngredientResponse[]) {
  qc.setQueryData<IngredientResponse[]>(fridgeKey, (old) => (old ? fn(old) : old));
}
/**
 * 이 냉장고 작업이 '마지막으로 진행 중'일 때만 냉장고·추천을 무효화(refetch)한다.
 * 진행 중 작업이 여럿이면(연속 추가·삭제, 장보기 이동 중 추가 등) 중간 refetch가 다른 낙관적
 * 변경을 덮어써 "다음 작업이 무시"되는 레이스가 생김 → 마지막 하나가 끝날 때 한 번만 서버와 정합.
 * onSettled 시점엔 자기 자신도 아직 mutating으로 세므로 === 1 이면 '내가 마지막'.
 * fridgeMutationKey를 공유하는 작업(add/remove/이동)끼리 이 카운트로 조율된다.
 */
export function settleFridgeIfLast(qc: QueryClient) {
  if (qc.isMutating({ mutationKey: fridgeMutationKey }) > 1) return;
  qc.invalidateQueries({ queryKey: fridgeKey }); // 실제 id·희귀도로 교체
  qc.invalidateQueries({ queryKey: ["recommend"] }); // 요리 매칭률 점등
}

export function useAddIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: fridgeMutationKey,
    mutationFn: (input: CreateIngredientRequest) => fridgeApi.createIngredient(input),
    // 담자마자 스티커가 바로 보이게(딜레이 없이). 서버 응답 오면 실제 항목으로 교체.
    onMutate: async (input) => {
      const prev = await snapshotFridge(qc);
      const tempId = `temp-${Date.now()}-${input.name}`;
      const optimistic: IngredientResponse = {
        id: tempId,
        name: input.name,
        category: input.category,
        rarity: "common",
        expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
      };
      patchFridge(qc, (list) => [...list, optimistic]);
      return { prev, tempId };
    },
    // 임시 id를 서버 실제 항목으로 교체. 임시 상태에서 이미 지운 항목은 실제 항목도 서버에서 삭제.
    onSuccess: (created, _input, ctx) => {
      if (ctx?.tempId && fridgeTemp.consume(ctx.tempId)) {
        fridgeApi.deleteIngredient(created.id).catch(() => {}); // 취소된 것 → 실제도 삭제
        patchFridge(qc, (list) => list.filter((i) => i.id !== ctx.tempId && i.id !== created.id));
        return;
      }
      patchFridge(qc, (list) => list.map((i) => (i.id === ctx?.tempId ? created : i)));
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(fridgeKey, ctx.prev);
    },
    onSettled: () => settleFridgeIfLast(qc),
  });
}

export function useRemoveIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: fridgeMutationKey,
    // 임시 재료는 서버에 없으니 삭제 호출 대신 '취소' 기록 → 담기 완료 시 실제 항목을 정리(재생성 방지).
    mutationFn: (id: string) => {
      if (fridgeTemp.isTemp(id)) {
        fridgeTemp.cancel(id);
        return Promise.resolve({ done: true } as const);
      }
      return fridgeApi.deleteIngredient(id);
    },
    onMutate: async (id) => {
      const prev = await snapshotFridge(qc);
      patchFridge(qc, (list) => list.filter((i) => i.id !== id));
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(fridgeKey, ctx.prev);
    },
    onSettled: () => settleFridgeIfLast(qc),
  });
}
