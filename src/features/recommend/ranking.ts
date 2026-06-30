/**
 * 추천 랭킹 — 냉장고 매칭률 계산 (순수 함수, DB 무관 → 테스트 용이).
 * "가진 재료 + 1~2개 추가" 추천 로직의 핵심 신호 (PRD 5.3).
 */
export function computeMatchRate(owned: string[], required: string[]): number {
  if (required.length === 0) return 0;
  const ownedSet = new Set(owned);
  const have = required.filter((name) => ownedSet.has(name)).length;
  return Math.round((have / required.length) * 100);
}

/** 추가구매가 필요한(가지지 않은) 재료만 추려낸다. */
export function missingIngredients(owned: string[], required: string[]): string[] {
  const ownedSet = new Set(owned);
  return required.filter((name) => !ownedSet.has(name));
}
