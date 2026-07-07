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
    },
  });
}
