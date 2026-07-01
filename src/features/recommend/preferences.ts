/**
 * 취향 반영 (선호·비선호·알러지 → 추천). 순수 함수라 테스트 용이, 마이그레이션 없음.
 *
 * - 알러지: 해당 재료가 든 제안은 **제외**(안전 — "다정한 룸메이트" 정체성).
 * - 비선호: 제외까진 아니고 **하향**(순위 페널티).
 * - 선호: **상향**(순위 보너스).
 * 매칭 방식(재료 정확일치 vs 이름 부분일치)은 호출부가 matcher로 주입한다.
 */

export interface PrefLabels {
  likes: string[];
  dislikes: string[];
  allergies: string[];
}

const LIKE_BONUS = 12;
const DISLIKE_PENALTY = 20;
const CAP = 2; // 한 항목이 여러 개 맞아도 과하지 않게

/** kind별로 태그를 묶는다 (라벨 배열). */
export function groupPreferences(tags: { kind: string; label: string }[]): PrefLabels {
  const g: PrefLabels = { likes: [], dislikes: [], allergies: [] };
  for (const t of tags) {
    if (t.kind === "like") g.likes.push(t.label);
    else if (t.kind === "dislike") g.dislikes.push(t.label);
    else if (t.kind === "allergy") g.allergies.push(t.label);
  }
  return g;
}

/** 알러지 라벨 중 하나라도 matcher에 걸리면 true(→ 추천에서 제외). */
export function hasAllergen(match: (label: string) => boolean, allergies: string[]): boolean {
  return allergies.some(match);
}

/** 선호(+)·비선호(-) 정렬 보정 점수. matchRate(0~100)에 더해 순위를 미세 조정. */
export function preferenceScore(
  match: (label: string) => boolean,
  likes: string[],
  dislikes: string[],
): number {
  const likeHits = likes.filter(match).length;
  const dislikeHits = dislikes.filter(match).length;
  return Math.min(likeHits, CAP) * LIKE_BONUS - Math.min(dislikeHits, CAP) * DISLIKE_PENALTY;
}

/** 재료 집합 exact-match matcher (요리 모드 — 재료 리스트가 있을 때). */
export function ingredientMatcher(canonicalIngredients: string[]): (label: string) => boolean {
  const set = new Set(canonicalIngredients);
  return (label) => set.has(label);
}

/** 이름 부분일치 matcher (외식·간편식 — 재료 리스트가 없어 이름으로 best-effort). */
export function nameMatcher(name: string): (label: string) => boolean {
  return (label) => name.includes(label);
}
