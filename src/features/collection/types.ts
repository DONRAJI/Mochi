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
