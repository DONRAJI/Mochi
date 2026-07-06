/**
 * 자취 현실성 점수 (순수 함수) — 자취생·1인 가구가 혼자 만들 만한 요리를 위로 올린다.
 *
 * 식약처 레시피 DB(1146개)엔 재료·단계가 많은 '정식 레시피'가 섞여 있어, 그대로 추천하면
 * "20대 자취생이 혼자 할 수 있는 음식"과 동떨어진다(사용자 피드백). 매칭률을 존중하되,
 * (a) 재료 적고·단계 짧고·빨리 되고 (b) **통계적으로 흔한 식재료**로 된 요리에 가산점을 준다.
 *
 * (b)가 중요한 이유: 재료가 3~4개여도 청국장·백년초가루처럼 잘 안 쓰는 특수 재료면 자취엔 부적절.
 * 그래서 '흔한 재료 비율'을 코퍼스(전체 레시피) 등장 빈도로 판정해 절반의 비중으로 반영한다.
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
  commonRatio: number; // 0~1 — 흔한 식재료 비율 (commonIngredientRatio 결과)
}

/**
 * 0~SOLO_WEIGHT. '만들기 쉬움(재료수·단계·시간)'과 '흔한 재료 비율'을 반반으로 섞는다.
 * - 쉬움: 재료 5개 이하·단계 4개 이하·15분 이하면 만점, 재료 15개·단계 12개·45분이면 0.
 * - 흔함: 재료가 전부 흔하면 만점, 전부 특수하면 0.
 */
export function soloFriendlyScore({
  ingredientCount,
  stepCount,
  minutes,
  commonRatio,
}: RecipeComplexity): number {
  const ing = clamp01(1 - (ingredientCount - 5) / 10);
  const step = clamp01(1 - (stepCount - 4) / 8);
  const time = clamp01(1 - (minutes - 15) / 30);
  const ease = (ing + step + time) / 3;
  const common = clamp01(commonRatio);
  return Math.round((ease * 0.5 + common * 0.5) * SOLO_WEIGHT);
}

/**
 * 코퍼스 빈도로 '흔한 재료' 판정 → 레시피의 흔한 재료 비율(0~1).
 * @param ingredients 이 레시피의 (정규화된) 재료 이름들
 * @param freq 재료별 등장 레시피 수 (전체 카탈로그로 집계)
 * @param total 전체 레시피 수
 *
 * 흔함 기준 = 전체의 1%(최소 3개 레시피) 이상에 등장. 그보다 드물면 특수 재료로 본다.
 * 재료 정보가 없으면(외식·간편식 등) 페널티를 주지 않도록 1을 반환.
 */
export function commonIngredientRatio(
  ingredients: string[],
  freq: Map<string, number>,
  total: number,
): number {
  if (ingredients.length === 0) return 1;
  const threshold = Math.max(3, total * 0.01);
  const common = ingredients.filter((name) => (freq.get(name) ?? 0) >= threshold).length;
  return common / ingredients.length;
}

/** 카탈로그 전체에서 재료별 등장 레시피 수를 집계 (한 레시피 안 중복은 1회). */
export function buildIngredientFrequency(
  recipes: { ingredients: string[] }[],
  canonicalize: (name: string) => string,
): Map<string, number> {
  const freq = new Map<string, number>();
  for (const r of recipes) {
    const seen = new Set<string>();
    for (const raw of r.ingredients) {
      const c = canonicalize(raw);
      if (seen.has(c)) continue; // 같은 재료가 한 레시피에 여러 번 나와도 1회만
      seen.add(c);
      freq.set(c, (freq.get(c) ?? 0) + 1);
    }
  }
  return freq;
}
