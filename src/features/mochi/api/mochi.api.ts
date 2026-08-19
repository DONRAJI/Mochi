import { fetcher } from "@/lib/fetcher";
import type { MochiStateResponse } from "../types";

export function fetchMochiState(): Promise<MochiStateResponse> {
  return fetcher<MochiStateResponse>("/api/mochi/state");
}

/** 홈 '모찌의 방'에 둘 카드 지정 (null이면 내리기). */
export function setDisplayCard(cardId: string | null): Promise<{ done: true }> {
  return fetcher<{ done: true }>("/api/mochi/display-card", {
    method: "PUT",
    body: JSON.stringify({ cardId }),
  });
}
