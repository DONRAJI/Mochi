"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as shoppingApi from "../api/shopping.api";

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

/** 체크한 것 냉장고로 — 냉장고·추천(매칭률)도 갱신. */
export function useMoveCheckedToFridge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => shoppingApi.moveCheckedToFridge(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["fridge"] });
      qc.invalidateQueries({ queryKey: ["recommend"] });
    },
  });
}
