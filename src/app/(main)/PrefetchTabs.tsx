"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchIngredients } from "@/features/fridge/api/fridge.api";
import { fetchRecommendations } from "@/features/recommend/api/recommend.api";
import { fetchMochiCollection } from "@/features/collection/api/collection.api";

/**
 * 탭 간 이동을 빠르게 — 앱 로드 직후(유휴) 다른 탭의 주요 데이터를 미리 당겨 캐시에 넣는다.
 * 그러면 첫 탭 전환도 네트워크 대기 없이 캐시로 즉시 표시된다(TWA 체감 속도 개선).
 * 초기 화면 fetch와 경쟁하지 않게 잠깐 뒤에 실행. 이미 fresh하면 prefetch는 건너뜀(staleTime).
 */
export function PrefetchTabs() {
  const qc = useQueryClient();
  useEffect(() => {
    const t = setTimeout(() => {
      qc.prefetchQuery({
        queryKey: ["recommend", "cook"],
        queryFn: () => fetchRecommendations("cook"),
      });
      qc.prefetchQuery({ queryKey: ["fridge", "ingredients"], queryFn: fetchIngredients });
      qc.prefetchQuery({ queryKey: ["collection", "mochi"], queryFn: fetchMochiCollection });
    }, 800);
    return () => clearTimeout(t);
  }, [qc]);
  return null;
}
