"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCollection } from "../api/collection.api";
import type { CollectionTab } from "../types";

/** queryKey ["collection", tab] — 먹었어요(record) 성공 시 ["collection"] 무효화로 자동 갱신. */
export function useCollection(type: CollectionTab) {
  return useQuery({
    queryKey: ["collection", type],
    queryFn: () => fetchCollection(type),
    retry: false,
  });
}
