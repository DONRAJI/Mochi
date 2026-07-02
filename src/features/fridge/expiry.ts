/**
 * 유통기한 유틸 (순수). 임박 재료를 먼저 쓰도록 추천에 반영 (PRD 5.2).
 * 강조는 빨강이 아니라 복숭아톤(불변 #1) — "곧 써볼까요?" 톤.
 */
const DAY_MS = 86_400_000;

/** 오늘로부터 며칠 남았는지(음수=지남). expiresAt 없으면 null. */
export function daysUntil(expiresAt: Date | string | null, now: Date): number | null {
  if (!expiresAt) return null;
  const t = typeof expiresAt === "string" ? new Date(expiresAt).getTime() : expiresAt.getTime();
  if (!Number.isFinite(t)) return null;
  return Math.ceil((t - now.getTime()) / DAY_MS);
}

/** within일 이내(지난 것 포함)면 임박. */
export function isExpiringSoon(
  expiresAt: Date | string | null,
  now: Date,
  within = 3,
): boolean {
  const d = daysUntil(expiresAt, now);
  return d !== null && d <= within;
}

/** 임박 재료를 쓰는 레시피에 주는 정렬 보너스(개수 기반, 캡). */
export function expiryBonus(
  ingredientNames: string[],
  expiringSet: Set<string>,
  perItem = 15,
  cap = 2,
): number {
  const hits = ingredientNames.filter((n) => expiringSet.has(n)).length;
  return Math.min(hits, cap) * perItem;
}
