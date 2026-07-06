/** 등급별 파스텔 배경 토큰 (빨강 없음 — 불변 #1·#4). 카드 타일·뽑기 연출 공용. */
export const RARITY_TINT: Record<string, string> = {
  common: "bg-cream-100",
  rare: "bg-mint-soft",
  epic: "bg-lavender-soft",
  legendary: "bg-butter-soft",
  seasonal: "bg-peach-soft",
};

/** 등급이 특별한가(에픽 이상) — 연출 강조용. */
export function isSpecial(rarity: string): boolean {
  return rarity === "epic" || rarity === "legendary" || rarity === "seasonal";
}
