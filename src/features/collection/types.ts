import { z } from "zod";

export type CollectionTab = "recipe" | "ingredient" | "convenience";

export const collectionQuerySchema = z.object({
  type: z.enum(["recipe", "ingredient", "convenience"]),
});

/** 도감 한 칸 — 카탈로그(전체) ⋈ 내 획득 여부. */
export interface CollectibleResponse {
  refId: string;
  name: string;
  emoji: string | null;
  rarity: string;
  acquired: boolean;
  acquiredAt: string | null; // ISO, 획득 시
}

/**
 * 도감 응답 — 게이지엔 전체(total)/획득(acquired), 그리드엔 items.
 * 레시피는 카탈로그가 1150개라 items를 '획득분 + 미획득 티저 일부'로 제한한다(압도감·성능).
 */
export interface CollectionResponse {
  total: number;
  acquired: number;
  items: CollectibleResponse[];
}
