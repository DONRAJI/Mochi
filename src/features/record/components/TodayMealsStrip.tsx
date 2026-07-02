"use client";

import { Card } from "@/components/ui/Card";
import { useTodayMeals } from "../hooks/useRecord";
import { SLOT_LABEL, SLOT_EMOJI } from "../slot";
import type { MealSlot } from "../types";

const MODE_LABEL: Record<"cook" | "eatout" | "convenience", string> = {
  cook: "요리",
  eatout: "외식",
  convenience: "간편식",
};

/**
 * 오늘의 기록 — 오늘 먹은 끼니를 슬롯별로 보여준다 (PRD 11.2 여러 끼니).
 * 칼로리는 detail(관리) 모드에서만 노출(#4) — 서버가 kcal을 채워 보낼 때만.
 */
export function TodayMealsStrip() {
  const { data: meals } = useTodayMeals();
  const total = (meals ?? []).reduce((sum, m) => sum + (m.kcal ?? 0), 0);

  return (
    <Card className="flex flex-col gap-2">
      <p className="font-display text-cocoa">오늘의 기록</p>
      {meals && meals.length > 0 ? (
        <>
          <ul className="flex flex-col gap-1.5">
            {meals.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm text-cocoa-soft">
                <span className="text-base">{SLOT_EMOJI[m.slot as MealSlot]}</span>
                <span className="text-cocoa">{SLOT_LABEL[m.slot as MealSlot]}</span>
                <span className="text-cocoa-faint">· {MODE_LABEL[m.mode]}</span>
                {m.kcal != null && <span className="ml-auto text-cocoa-faint">{m.kcal} kcal</span>}
              </li>
            ))}
          </ul>
          {total > 0 && (
            <p className="border-t border-cream-200 pt-2 text-right text-sm text-cocoa-soft">
              오늘 합계 {total} kcal
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-cocoa-faint">아직 오늘 기록이 없어요. 한 끼 담아볼까요?</p>
      )}
    </Card>
  );
}
