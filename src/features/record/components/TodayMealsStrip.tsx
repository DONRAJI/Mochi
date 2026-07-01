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
 * 하루 전체가 보여야 밸런싱(11.5)이 가능하므로 효과 축의 전제. 숫자·칼로리는 없음(불변 #2).
 */
export function TodayMealsStrip() {
  const { data: meals } = useTodayMeals();

  return (
    <Card className="flex flex-col gap-2">
      <p className="font-display text-cocoa">오늘의 기록</p>
      {meals && meals.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {meals.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm text-cocoa-soft">
              <span className="text-base">{SLOT_EMOJI[m.slot as MealSlot]}</span>
              <span className="text-cocoa">{SLOT_LABEL[m.slot as MealSlot]}</span>
              <span className="text-cocoa-faint">· {MODE_LABEL[m.mode]}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cocoa-faint">아직 오늘 기록이 없어요. 한 끼 담아볼까요?</p>
      )}
    </Card>
  );
}
