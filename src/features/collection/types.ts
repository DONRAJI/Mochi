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
