"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as shoppingApi from "../api/shopping.api";
import type { ShoppingItemResponse } from "../shopping";
import { fridgeMutationKey, settleFridgeIfLast } from "./useFridge";

const KEY = ["shopping"] as const;
// 장보기 변경 공통 mutation 키 — 진행 중 장보기 작업 수를 세어 마지막에만 refetch(레이스 방지).
const shoppingMutationKey = ["shopping", "mutation"] as const;

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
      const temps: ShoppingItemResponse[] = names.map((name, i) => ({
        id: `temp-${Date.now()}-${i}`,
        name,
        checked: false,
      }));
      patchShopping(qc, (list) => [...list, ...temps]);
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => settleShoppingIfLast(qc),
  });
}

export function useToggleShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: shoppingMutationKey,
    mutationFn: (id: string) => shoppingApi.toggleShopping(id),
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
    mutationFn: (id: string) => shoppingApi.removeShopping(id),
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
