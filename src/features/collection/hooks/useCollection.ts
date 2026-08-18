"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMochiCollection, drawMochiCard } from "../api/collection.api";
import { useMochiStore } from "@/store/mochi";

/** 모찌 뽑기 도감 (PRD 12) — 먹었어요/뽑기 시 ["collection","mochi"] 무효화로 씨앗·획득 갱신. */
export function useMochiCollection() {
  return useQuery({
    queryKey: ["collection", "mochi"],
    queryFn: fetchMochiCollection,
    retry: false,
  });
}

export function useDrawCard() {
  const qc = useQueryClient();
  const setMochi = useMochiStore((s) => s.setState);
  return useMutation({
    mutationFn: () => drawMochiCard(),
    onSuccess: () => {
      setMochi("cheer");
      qc.invalidateQueries({ queryKey: ["collection", "mochi"] });
      // 뽑기는 모은 카드 수(=모찌 성장 단계)와 씨앗을 바꾼다 → 홈도 갱신.
      // 이게 없으면 첫 뽑기 후에도 홈의 첫 안내가 남고 성장 단계가 옛 값으로 보인다.
      qc.invalidateQueries({ queryKey: ["mochi"] });
    },
  });
}
