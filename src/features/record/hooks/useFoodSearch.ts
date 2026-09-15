"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchFoods } from "../api/food.api";

/** 타이핑 중 매 글자마다 조회하지 않게 — 입력이 멈추면 찾는다. */
const DEBOUNCE_MS = 300;

/**
 * 음식 영양 사전 검색. 두 글자 미만이거나 비활성이면 조회하지 않는다.
 * 사전은 적재 때만 바뀌므로 오래 캐시한다 — 같은 이름을 다시 쳐도 요청이 안 나간다.
 */
export function useFoodSearch(query: string, opts: { enabled: boolean }) {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const q = debounced.trim();
  return useQuery({
    queryKey: ["foods", q],
    queryFn: () => searchFoods(q),
    enabled: opts.enabled && q.replace(/\s+/g, "").length >= 2,
    staleTime: 10 * 60_000,
  });
}
