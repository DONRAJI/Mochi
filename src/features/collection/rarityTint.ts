/** 등급별 파스텔 배경 토큰 (빨강 없음 — 불변 #1·#4). 카드 타일·뽑기 연출 공용. */
export const RARITY_TINT: Record<string, string> = {
  common: "bg-cream-100",
  rare: "bg-mint-soft",
  epic: "bg-lavender-soft",
  legendary: "bg-butter-soft",
  seasonal: "bg-peach-soft",
};

/** 에픽 이상 카드의 링 강조 (뽑기 연출용) — 등급 톤과 같은 계열 deep. 없는 등급은 링 없음. */
export const RARITY_RING: Record<string, string | undefined> = {
  epic: "ring-2 ring-lavender-deep",
  legendary: "ring-2 ring-butter-deep shadow-mochi-lift",
  seasonal: "ring-2 ring-peach-deep",
};

/** 등급이 특별한가(에픽 이상) — 연출 강조용. */
export function isSpecial(rarity: string): boolean {
  return rarity === "epic" || rarity === "legendary" || rarity === "seasonal";
}
