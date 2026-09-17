/**
 * 한 끼 양감 라벨 (순수) — 숫자 없이 "얼마나 가벼운가"를 말로 알려준다.
 *
 * 왜: 숫자를 숨기는(cozy) 사용자는 '가벼운 순' 정렬만 받아서, 왜 위에 있는지 모르면 고르는 순간에
 * 도움이 안 됐다. 칼로리를 몰라도 고르게 하는 색 분류(Noom 방식)를 빨강 없이 말로 옮긴 것 —
 * 세 단계 모두 좋은 선택이고(불변 #1), 숫자가 아니라 라벨이라 홈·cozy에도 보여도 된다(불변 #2).
 *
 * 기준은 1인분 kcal(레시피·외식·음식 사전 모두 1인분 기준으로 정리돼 있다).
 * 350 이하는 기존 '가벼움' 뱃지와 같은 선 · 700 초과는 밥+국+반찬 한 상을 넘는 양.
 */

export type Portion = "light" | "hearty" | "full";

export const PORTION_MAX_KCAL = { light: 350, hearty: 700 } as const;

export const PORTION_LABEL: Record<Portion, string> = {
  light: "🍃 가볍게",
  hearty: "🍚 든든하게",
  full: "🍲 푸짐하게",
};

/** 1인분 kcal → 양감. 칼로리를 모르면 null — 근거 없는 라벨을 지어내지 않는다. */
export function portionOf(kcal: number | null | undefined): Portion | null {
  if (kcal == null || !Number.isFinite(kcal) || kcal < 0) return null;
  if (kcal <= PORTION_MAX_KCAL.light) return "light";
  if (kcal <= PORTION_MAX_KCAL.hearty) return "hearty";
  return "full";
}
