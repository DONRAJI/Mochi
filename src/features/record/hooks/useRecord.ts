"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markMealEaten } from "../api/record.api";
import { useMochiStore } from "@/store/mochi";
import type { MarkMealRequest } from "../types";

/** '먹었어요' — 성공 시 모찌가 즉시 cheer, 도감·모찌 쿼리 무효화. */
export function useMarkMealEaten() {
  const qc = useQueryClient();
  const setMochi = useMochiStore((s) => s.setState);
  return useMutation({
    mutationFn: (input: MarkMealRequest) => markMealEaten(input),
    onSuccess: () => {
      setMochi("cheer");
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["mochi"] });
    },
  });
}
