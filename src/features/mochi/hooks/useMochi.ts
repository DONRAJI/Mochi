"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMochiState, setDisplayCard } from "../api/mochi.api";

/** queryKey ["mochi","state"] — 먹었어요(record) 시 ["mochi"] 무효화로 갱신. */
export function useMochiState() {
  return useQuery({
    queryKey: ["mochi", "state"],
    queryFn: fetchMochiState,
    staleTime: 60_000,
  });
}

/** 방에 둘 카드 지정/내리기 — 성공 시 홈(모찌 상태)을 갱신해 바로 반영. */
export function useSetDisplayCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string | null) => setDisplayCard(cardId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mochi"] }),
  });
}
