"use client";

import { useTodayMeals, useDailyBudget } from "../hooks/useRecord";
import { dailyBalanceMessage } from "../balance";

/**
 * 밸런싱 배너 (#4 심화) — detail 모드에서 오늘 예산 잔여를 식단 선택 지점에 명시.
 * "제안(미래)에서 효과"(PRD 11.1): 다음 끼니를 고르는 곳에서 여유를 알려 선택을 돕는다.
 * budget이 null(cozy거나 프로필 미완비)이면 아무것도 안 그린다.
 */
export function BalanceBanner() {
  const { data: budgetData } = useDailyBudget();
  const { data: meals } = useTodayMeals();
  const budget = budgetData?.budget ?? null;
  if (budget == null) return null;

  const total = (meals ?? []).reduce((sum, m) => sum + (m.kcal ?? 0), 0);
  return (
    <div className="rounded-mochi bg-mint-soft px-4 py-3 text-center text-sm text-cocoa shadow-mochi-press">
      {dailyBalanceMessage(total, budget)}
    </div>
  );
}
