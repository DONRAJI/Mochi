"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMochiState } from "../api/mochi.api";

/** queryKey ["mochi","state"] — 먹었어요(record) 시 ["mochi"] 무효화로 갱신. */
export function useMochiState() {
  return useQuery({
    queryKey: ["mochi", "state"],
    queryFn: fetchMochiState,
    staleTime: 60_000,
  });
}
