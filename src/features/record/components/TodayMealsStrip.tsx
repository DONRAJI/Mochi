"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Gauge } from "@/components/ui/Gauge";
import { useTodayMeals, useDailyBudget, useDeleteMeal } from "../hooks/useRecord";
import { dailyBalanceMessage } from "../balance";
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
  const { data: budgetData } = useDailyBudget();
  const del = useDeleteMeal();
  const total = (meals ?? []).reduce((sum, m) => sum + (m.kcal ?? 0), 0);
  const budget = budgetData?.budget ?? null; // detail 모드 + 프로필 완비 시만

  return (
    <Card className="flex flex-col gap-2">
      <p className="font-display text-cocoa">오늘의 기록</p>

      {meals && meals.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {meals.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm text-cocoa-soft">
              {m.photoUrl && (
                <Image
                  src={m.photoUrl}
                  alt="식사 사진"
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded-mochi-sm object-cover"
                />
              )}
              <span className="text-base">{SLOT_EMOJI[m.slot as MealSlot]}</span>
              <span className="text-cocoa">{SLOT_LABEL[m.slot as MealSlot]}</span>
              <span className="text-cocoa-faint">· {MODE_LABEL[m.mode]}</span>
              {m.kcal != null && <span className="ml-auto text-cocoa-faint">{m.kcal} kcal</span>}
              <button
                type="button"
                onClick={() => del.mutate(m.id)}
                aria-label="기록 삭제"
                className={cn(
                  "px-1 text-cocoa-faint transition-transform ease-jelly active:scale-90",
                  m.kcal == null && "ml-auto",
                )}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cocoa-faint">아직 오늘 기록이 없어요. 한 끼 담아볼까요?</p>
      )}

      {/* detail 모드: TDEE 예산 대비 오늘 섭취. 초과해도 경고 없음(죄책감 제로). */}
      {budget != null ? (
        <div className="border-t border-cream-200 pt-2">
          <div className="mb-1 flex justify-between text-sm text-cocoa-soft">
            <span>오늘</span>
            <span>
              {total.toLocaleString()} / {budget.toLocaleString()} kcal
            </span>
          </div>
          <Gauge value={total} max={budget} tone="mint" />
          <p className="mt-1.5 text-sm text-cocoa-soft">{dailyBalanceMessage(total, budget)}</p>
        </div>
      ) : (
        total > 0 && (
          <p className="border-t border-cream-200 pt-2 text-right text-sm text-cocoa-soft">
            오늘 합계 {total.toLocaleString()} kcal
          </p>
        )
      )}
    </Card>
  );
}
