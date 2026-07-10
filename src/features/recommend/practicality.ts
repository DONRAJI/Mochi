/**
 * 실용성 필터 (순수 함수) — "집에서 실제로 해먹을 만한 요리"만 추천에 남긴다.
 *
 * 식약처 코퍼스(1153개)엔 초희귀 재료(북어채·백년초가루 등, 코퍼스 ≤2회 등장)를 쓰거나
 * 재료가 과다한 '정식/행사 요리'가 많아 타깃(20대 자취생)과 동떨어진다(사용자 피드백).
 * soloFriendly의 랭킹 하향만으론 부족해(사과 새우 북엇국이 쉬움 점수 20/24로 통과)
 * 여기서 하드 컷한다. 데이터 분석(2026-07-09) 기준 1153 → 509개 유지.
 *
 * - 런타임 필터(DB 삭제 아님): 임계값 조정·롤백이 코드 한 줄. 새 인제스트에도 자동 적용.
 * - 내 요리(ownerId)는 서비스에서 예외 처리 — 사용자가 등록한 건 항상 노출.
 * - 도감이 모찌 뽑기로 개편되어 레시피 수 감소에 따른 손실 없음.
 */

/** 코퍼스 등장 ≤2회 = 초희귀(사실상 구할 일 없는 재료). */
export const ULTRA_RARE_MAX = 2;

/** 코퍼스 등장 ≤5회 = 잘 안 쓰는 재료 — "없어도 괜찮아요" 힌트 대상 (하드 컷과 별개). */
export const RARE_HINT_MAX = 5;

/** 재료 중 초희귀 개수. names는 정규화된 고유 재료명(중복 제거). */
export function countUltraRare(names: string[], freq: Map<string, number>): number {
  return names.filter((n) => (freq.get(n) ?? 0) <= ULTRA_RARE_MAX).length;
}

/**
 * 집에서 실제로 해먹을 만한가 — 아래 하나라도 걸리면 비실전:
 * 초희귀 재료 2개↑ · (초희귀 1개 + 재료 10개↑) · 재료 15개↑.
 * (사과 새우 북엇국=초희귀2 → 컷 · 인삼갈비탕=초희귀1+재료11 → 컷)
 */
export function isPractical(names: string[], freq: Map<string, number>): boolean {
  const ultra = countUltraRare(names, freq);
  if (ultra >= 2) return false;
  if (ultra >= 1 && names.length >= 10) return false;
  return names.length < 15;
}

/**
 * '잘 안 쓰는 재료예요 — 없어도 괜찮아요' 힌트 대상인가.
 * 흔한 양념(후추·깨)이 아니라 희귀 재료에 대해서만 말한다(사용자 피드백).
 * 요리 이름에 든 주인공 재료는 제외(돌나물 샐러드에서 돌나물을 빼라고 하지 않기).
 */
export function isSkippableRare(
  name: string,
  freq: Map<string, number>,
  recipeName: string,
): boolean {
  if ((freq.get(name) ?? 0) > RARE_HINT_MAX) return false;
  return !recipeName.replace(/\s+/g, "").includes(name);
}
