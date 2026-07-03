/**
 * 자취 현실성 점수 (순수 함수) — 자취생·1인 가구가 혼자 만들 만한 요리를 위로 올린다.
 *
 * 식약처 레시피 DB(1146개)엔 재료·단계가 많은 '정식 레시피'가 섞여 있어, 그대로 추천하면
 * "20대 자취생이 혼자 할 수 있는 음식"과 동떨어진다(사용자 피드백). 매칭률을 존중하되,
 * 재료 적고·단계 짧고·빨리 되는 요리에 부드러운 가산점을 줘 현실적인 한 끼를 우선한다.
 *
 * - 하드 제외가 아니라 랭킹 보정: 비요리 동등·카탈로그 다양성을 해치지 않는다.
 * - 가중치(SOLO_WEIGHT)는 취향 보너스(≈±24)와 같은 급 — matchRate(0~100)를 뒤엎지 않는다.
 */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** 최대 가산점. 취향·임박 보정과 같은 규모로 둬 매칭률을 압도하지 않게. */
const SOLO_WEIGHT = 24;

export interface RecipeComplexity {
  ingredientCount: number;
  stepCount: number;
  minutes: number;
}

/**
 * 0~SOLO_WEIGHT. 셋 다 간단할수록 만점.
 * - 재료 5개 이하 만점 → 15개 이상 0
 * - 단계 4개 이하 만점 → 12개 이상 0
 * - 15분 이하 만점 → 45분 이상 0
 */
export function soloFriendlyScore({ ingredientCount, stepCount, minutes }: RecipeComplexity): number {
  const ing = clamp01(1 - (ingredientCount - 5) / 10);
  const step = clamp01(1 - (stepCount - 4) / 8);
  const time = clamp01(1 - (minutes - 15) / 30);
  return Math.round(((ing + step + time) / 3) * SOLO_WEIGHT);
}
