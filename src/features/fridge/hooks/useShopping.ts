"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as shoppingApi from "../api/shopping.api";
import { fridgeMutationKey, settleFridgeIfLast } from "./useFridge";

const KEY = ["shopping"] as const;

export function useShopping() {
  return useQuery({ queryKey: KEY, queryFn: shoppingApi.fetchShopping, retry: false });
}

export function useAddShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => shoppingApi.addShopping(names),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shoppingApi.toggleShopping(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shoppingApi.removeShopping(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * 체크한 것 냉장고로 — 냉장고를 바꾸므로 fridgeMutationKey를 공유해 냉장고 add/remove와 같은
 * 가드를 받는다. 냉장고·추천 무효화는 '진행 중 냉장고 작업이 없을 때만'(settleFridgeIfLast) →
 * 이동 refetch가 진행 중 재료 추가/삭제의 낙관적 변경을 덮어써 무시되는 레이스 방지.
 * 장보기(KEY)는 낙관적 아님 → 항상 갱신.
 */
export function useMoveCheckedToFridge() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: fridgeMutationKey,
    mutationFn: () => shoppingApi.moveCheckedToFridge(),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY });
      settleFridgeIfLast(qc); // 냉장고·추천은 가드로(냉장고 작업 진행 중이면 그쪽 마지막 settle이 refetch)
    },
  });
}
