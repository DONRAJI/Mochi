"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as shoppingApi from "../api/shopping.api";
import type { ShoppingItemResponse } from "../shopping";
import { makeTempCanceller } from "@/lib/optimistic-temp";
import { fridgeMutationKey, settleFridgeIfLast } from "./useFridge";

const KEY = ["shopping"] as const;
// 장보기 변경 공통 mutation 키 — 진행 중 장보기 작업 수를 세어 마지막에만 refetch(레이스 방지).
const shoppingMutationKey = ["shopping", "mutation"] as const;
// 서버 id 오기 전 임시 항목을 지운 경우 추적(재생성 방지).
const shoppingTemp = makeTempCanceller();

export function useShopping() {
  return useQuery({ queryKey: KEY, queryFn: shoppingApi.fetchShopping, retry: false });
}

// ── 낙관적 업데이트 헬퍼 (담기·체크 토글·삭제 공용) ──
// 냉장고와 동일: 캐시부터 바꿔 즉시 반응하고, 마지막 작업이 끝날 때만 서버와 정합.
async function snapshotShopping(qc: QueryClient) {
  await qc.cancelQueries({ queryKey: KEY });
  return qc.getQueryData<ShoppingItemResponse[]>(KEY);
}
function patchShopping(
  qc: QueryClient,
  fn: (list: ShoppingItemResponse[]) => ShoppingItemResponse[],
) {
  qc.setQueryData<ShoppingItemResponse[]>(KEY, (old) => (old ? fn(old) : old));
}
/** 이 장보기 작업이 '마지막 진행 중'일 때만 무효화 — 중간 refetch가 다른 낙관적 변경을 덮지 않게. */
function settleShoppingIfLast(qc: QueryClient) {
  if (qc.isMutating({ mutationKey: shoppingMutationKey }) > 1) return;
  qc.invalidateQueries({ queryKey: KEY });
}

export function useAddShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: shoppingMutationKey,
    mutationFn: (names: string[]) => shoppingApi.addShopping(names),
    onMutate: async (names) => {
      const prev = await snapshotShopping(qc);
      const tempIds = names.map((_, i) => `temp-${Date.now()}-${i}`);
      const temps: ShoppingItemResponse[] = names.map((name, i) => ({
        id: tempIds[i],
        name,
        checked: false,
      }));
      patchShopping(qc, (list) => [...list, ...temps]);
      return { prev, tempIds };
    },
    // 임시 id → 서버 실제 항목으로 정합. 임시 상태에서 이미 지운 항목은 실제 항목도 서버에서 삭제.
    onSuccess: (serverList, _names, ctx) => {
      const prevIds = new Set((ctx?.prev ?? []).map((i) => i.id));
      const created = serverList.filter((i) => !prevIds.has(i.id)); // 이번에 서버가 만든 항목들
      const removeIds = new Set<string>();
      ctx?.tempIds?.forEach((tempId, idx) => {
        if (shoppingTemp.consume(tempId) && created[idx]) {
          removeIds.add(created[idx].id);
          shoppingApi.removeShopping(created[idx].id).catch(() => {}); // 취소된 것 → 실제도 삭제
        }
      });
      // 실제 id로 교체(동시 다른 장보기 작업 없을 때만 — 있으면 그쪽 settle이 정합).
      if (qc.isMutating({ mutationKey: shoppingMutationKey }) <= 1) {
        qc.setQueryData(
          KEY,
          serverList.filter((i) => !removeIds.has(i.id)),
        );
      }
    },
    onError: (_e, _vars, ctx) => {
      ctx?.tempIds?.forEach((id) => shoppingTemp.consume(id)); // 실패 시 취소 표시 정리
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => settleShoppingIfLast(qc),
  });
}

export function useToggleShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: shoppingMutationKey,
    // 아직 서버에 없는 임시 항목은 토글 호출을 보내지 않는다(403 방지) — 담기 완료 후 실제 상태로 정합.
    mutationFn: (id: string) =>
      shoppingTemp.isTemp(id)
        ? Promise.resolve({ done: true } as const)
        : shoppingApi.toggleShopping(id),
    // 체크가 서버 왕복 없이 즉시 반영되게(낙관적).
    onMutate: async (id) => {
      const prev = await snapshotShopping(qc);
      patchShopping(qc, (list) =>
        list.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => settleShoppingIfLast(qc),
  });
}

export function useRemoveShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: shoppingMutationKey,
    // 임시 항목은 서버에 없으니 삭제 호출 대신 '취소'로 기록 → 담기 완료 시 실제 항목을 정리(재생성 방지).
    mutationFn: (id: string) => {
      if (shoppingTemp.isTemp(id)) {
        shoppingTemp.cancel(id);
        return Promise.resolve({ done: true } as const);
      }
      return shoppingApi.removeShopping(id);
    },
    onMutate: async (id) => {
      const prev = await snapshotShopping(qc);
      patchShopping(qc, (list) => list.filter((i) => i.id !== id));
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => settleShoppingIfLast(qc),
  });
}

/**
 * 체크한 것 냉장고로 — 냉장고를 바꾸므로 fridgeMutationKey를 공유해 냉장고 add/remove와 같은
 * 가드를 받는다(냉장고·추천은 settleFridgeIfLast). 장보기(KEY)는 진행 중 장보기 낙관적 작업이
 * 없을 때만 refetch — 있으면 그쪽 마지막 settle이 refetch를 맡는다(레이스 방지).
 */
export function useMoveCheckedToFridge() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: fridgeMutationKey,
    mutationFn: () => shoppingApi.moveCheckedToFridge(),
    onSettled: () => {
      // move는 장보기 그룹이 아니므로 ===0(진행 중 장보기 작업 없음)일 때만 직접 refetch.
      if (qc.isMutating({ mutationKey: shoppingMutationKey }) === 0) {
        qc.invalidateQueries({ queryKey: KEY });
      }
      settleFridgeIfLast(qc);
    },
  });
}
