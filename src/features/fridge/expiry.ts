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

/** 지난 지 이만큼까지만 '임박'으로 본다 — 오래전에 지난 재료로 추천 가산점을 계속 주지 않게. */
export const RECENTLY_PAST_DAYS = 2;

/**
 * within일 이내면 임박(막 지난 것 포함). 담을 때 보관 기한을 자동 추정하면서(shelfLife) 잊힌 재료가
 * 쌓이는데, 예전처럼 '지난 것 전부'를 임박으로 두면 그 재료 요리가 추천 위에 영영 남는다.
 */
export function isExpiringSoon(expiresAt: Date | string | null, now: Date, within = 3): boolean {
  const d = daysUntil(expiresAt, now);
  return d !== null && d >= -RECENTLY_PAST_DAYS && d <= within;
}

/**
 * 냉장고 선반용 — 곧 쓰면 좋은 것(오늘~within일)과 이미 지난 것을 나눈다.
 * 지난 재료를 '곧 써보면 좋아요'에 섞으면 상했을 수 있는 걸 권하는 셈이라 따로 둔다.
 */
export function splitByExpiry<T extends { expiresAt: string | null }>(
  items: T[],
  now: Date,
  within = 3,
): { soon: T[]; past: T[] } {
  const soon: T[] = [];
  const past: T[] = [];
  for (const item of items) {
    const d = daysUntil(item.expiresAt, now);
    if (d === null) continue;
    if (d < 0) past.push(item);
    else if (d <= within) soon.push(item);
  }
  return { soon, past };
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
