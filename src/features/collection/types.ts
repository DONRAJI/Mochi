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

/** 모찌 뽑기 카드 한 장 (PRD 12). 미획득이면 acquired=false·count=0(실루엣 티저). */
export interface MochiCardResponse {
  id: string;
  name: string;
  rarity: string;
  imageUrl: string;
  flavor: string;
  acquired: boolean;
  count: number; // 중복 친밀도(보유 수)
  acquiredAt: string | null;
}

/** 모찌 도감 전체 — 씨앗·뽑기비용 + 카드 그리드. */
export interface MochiCollectionResponse {
  seeds: number;
  drawCost: number;
  total: number;
  acquired: number;
  cards: MochiCardResponse[];
}

/** 뽑기 결과 — 카드 + 신규 여부 + 중복 환급 + 남은 씨앗. */
export interface DrawResultResponse {
  card: MochiCardResponse;
  isNew: boolean;
  refund: number;
  seedsLeft: number;
}
