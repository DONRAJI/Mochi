/**
 * 트렌드 기반 밸런싱 넛지 (PRD 11.5) — 순수 함수라 테스트 용이.
 *
 * 철학(PRD 11.1): "효과는 제안(미래)에서, 죄책감 제로는 기록(과거)에서."
 * - 이미 먹은 것(과거)엔 절대 벌 없음. 며칠 든든했어도 비난하지 않는다.
 * - 다음 선택(미래)만 부드럽게 유도 — 경고가 아니라 제안, 응원 톤 유지.
 * - 숫자(kcal)는 근거로만 쓰고 화면엔 안 띄운다(불변 #2).
 */

export type NudgeKind = "light" | "steady" | "cheer";

export interface Nudge {
  kind: NudgeKind;
  message: string; // 모찌 보이스 (부드럽게, 경고 톤 금지)
}

/** 프로필(TDEE)이 없을 때 '든든한 한 끼'로 볼 대략 기준(kcal). */
const HEAVY_MEAL_KCAL = 600;

/**
 * 최근 끼니들의 kcal 추세 + (선택) TDEE로 오늘의 부드러운 제안을 고른다.
 * @param recentMealKcals 최근 끼니 kcal (0/음수는 무시)
 * @param tdee 개인화 권장에너지 (없으면 null → 끼니 평균 휴리스틱)
 */
export function balanceNudge(recentMealKcals: number[], tdee: number | null): Nudge {
  const kcals = recentMealKcals.filter((k) => k > 0);

  // 데이터가 적으면 판단하지 않고 그냥 응원 (섣부른 교정 금지)
  if (kcals.length < 2) {
    return { kind: "cheer", message: "오늘도 같이 맛있게 먹어봐요 🍮" };
  }

  const avg = kcals.reduce((a, b) => a + b, 0) / kcals.length;
  // TDEE가 있으면 한 끼 예산(≈TDEE/3)의 15% 초과를 '든든'으로. 없으면 고정 기준.
  const heavyThreshold = tdee != null ? (tdee / 3) * 1.15 : HEAVY_MEAL_KCAL;

  if (avg > heavyThreshold) {
    return {
      kind: "light",
      message: "요 며칠 든든하게 먹었어요. 오늘은 가벼운 걸로 골라볼까요? 🍃",
    };
  }

  return { kind: "steady", message: "요즘 밸런스가 좋아요, 이대로 같이 가요 😊" };
}

/** 여유/딱좋음을 가르는 여유 폭(kcal) — 이 안쪽은 "딱 좋아요". */
const BALANCE_MARGIN = 150;

/**
 * detail(관리) 모드 오늘 잔여 예산 한 줄 (#4 심화) — TDEE 대비 오늘 섭취.
 * 죄책감 제로: 넘겨도 경고가 아니라 "내일은 가볍게" 부드러운 제안. (숫자는 detail 모드에서만)
 */
export function dailyBalanceMessage(consumed: number, budget: number): string {
  const remaining = budget - consumed;
  if (remaining >= BALANCE_MARGIN) return `오늘 ${remaining.toLocaleString()}kcal 여유 있어요 🍃`;
  if (remaining <= -BALANCE_MARGIN)
    return `오늘 ${Math.abs(remaining).toLocaleString()}kcal 넉넉했어요. 내일은 가볍게 어때요? 😊`;
  return "오늘 딱 좋아요 😊";
}
