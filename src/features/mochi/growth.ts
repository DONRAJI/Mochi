/**
 * 모찌 성장 — **잘 먹은 날의 누적**으로 자란다.
 *
 * 왜 기록 수인가: 예전엔 성장 단계가 모은 카드 수의 함수라 도감 컴플리트 게이지와 같은 것을
 * 두 번 재고 있었다. 뽑기 한 번에 두 곳이 동시에 오르니 각각이 싱거워지고, 무엇보다 **뽑기 운이
 * 나쁜 사용자에겐 오르는 축이 하나도 없었다.** 성장을 기록에 묶으면 역할이 갈린다 —
 * 도감=뽑기 운(스파이크), 성장=꾸준함(반드시 오름). 라이트 사용자가 이어가게 하는 건 후자다.
 *
 * 되돌아가지 않는다: 누적 기록 수는 줄지 않으므로 모찌가 작아지는 일은 없다(불변 #1).
 */

/** 각 단계에 들어가는 데 필요한 누적 기록 수. 첫 끼 → 며칠 → 1주 → 2주 → 한 달. */
export const GROWTH_THRESHOLDS = [0, 3, 7, 14, 30] as const;

export const MAX_GROWTH_STAGE = GROWTH_THRESHOLDS.length;

/** 단계별 칭호 — '다 자랐다'로 끝맺지 않는다(끝나면 이어갈 이유가 사라진다). */
export const GROWTH_TITLES = [
  "새싹 모찌",
  "말랑 모찌",
  "포근 모찌",
  "든든한 모찌",
  "반짝반짝 모찌",
] as const;

/** 누적 기록 수 → 성장 단계(1~5). */
export function growthStageFor(mealCount: number): number {
  return GROWTH_THRESHOLDS.filter((t) => mealCount >= t).length;
}

export function growthTitle(stage: number): string {
  const i = Math.min(Math.max(stage, 1), MAX_GROWTH_STAGE) - 1;
  return GROWTH_TITLES[i] ?? GROWTH_TITLES[0];
}

/** 다음 단계까지 남은 기록 수. 이미 마지막 단계면 null. */
export function nextGrowthIn(mealCount: number): number | null {
  const stage = growthStageFor(mealCount);
  if (stage >= MAX_GROWTH_STAGE) return null;
  return GROWTH_THRESHOLDS[stage] - mealCount;
}

/**
 * 성장 안내 문구 — 도착지를 알려준다. 못 한 걸 지적하지 않고 권유형으로(불변 #1).
 * 숫자는 '잘 먹은 날'이라는 행동 카운트라 불변 #2(체중·칼로리)와 무관 — 홈의 스트릭 일수와 같은 층위.
 */
export function growthMessage(mealCount: number): string {
  const left = nextGrowthIn(mealCount);
  if (left === null) return "모찌가 한껏 자랐어요. 오늘도 같이 잘 먹어요 ✨";
  if (mealCount === 0) return "한 끼 기록하면 모찌가 자라기 시작해요";
  return `${left}번 더 기록하면 모찌가 자라요`;
}
