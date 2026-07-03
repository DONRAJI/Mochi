"use client";

import { cn } from "@/lib/utils";
import { weekDates, ymd, WEEKDAY_LABEL } from "../week";
import { usePlanWeek, useRemovePlan, useEatPlan, useAutoFillWeek } from "../hooks/usePlan";
import { SLOT_LABEL, SLOT_EMOJI } from "@/features/record/slot";
import type { MealSlot } from "@/features/record/types";
import type { PlannedMealResponse } from "../plan";

/** 아침→점심→저녁→간식 순으로 정렬(끼니 없는 건 뒤로) — 식단표처럼 보이게. */
const SLOT_ORDER: Record<MealSlot, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
const slotRank = (s: MealSlot | null) => (s ? SLOT_ORDER[s] : 9);

/**
 * 주간 식단 캘린더 (PRD 4.3·5.3) — 이번 주(월~일) 계획을 실데이터로.
 * 추천/상세에서 "이 날에 담기"로 채우고, 계획을 '먹었어요'하면 기록 루프로 이어진다.
 * 숫자(칼로리)는 없음(불변 #2).
 */
export function WeeklyPlanCalendar() {
  const week = weekDates(new Date());
  const today = ymd(new Date());
  const { data: meals } = usePlanWeek();
  const remove = useRemovePlan();
  const eat = useEatPlan();
  const autoFill = useAutoFillWeek();

  const byDate = new Map<string, PlannedMealResponse[]>();
  for (const m of meals ?? []) {
    const arr = byDate.get(m.date) ?? [];
    arr.push(m);
    byDate.set(m.date, arr);
  }
  // 각 날짜의 끼니를 아침→점심→저녁 순으로 정렬.
  for (const arr of byDate.values()) arr.sort((a, b) => slotRank(a.slot) - slotRank(b.slot));
  const hasEmpty = week.some((d) => !byDate.has(d));

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-cocoa-faint">이번 주 식단</p>
        {hasEmpty && (
          <button
            type="button"
            onClick={() => autoFill.mutate(week)}
            className="rounded-mochi-sm bg-lavender-soft px-2.5 py-1 text-xs text-cocoa transition-transform ease-jelly active:scale-90"
          >
            {autoFill.isPending ? "채우는 중…" : "🎲 자동 채우기"}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {week.map((date, i) => {
          const dayMeals = byDate.get(date) ?? [];
          const isToday = date === today;
          return (
            <div
              key={date}
              className={cn(
                "rounded-mochi px-3 py-2 shadow-mochi-press",
                isToday ? "bg-mint-soft" : "bg-cream-50",
              )}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span className="font-display text-sm text-cocoa">{WEEKDAY_LABEL[i]}</span>
                <span className="text-xs text-cocoa-faint">
                  {Number(date.slice(8, 10))}일{isToday ? " · 오늘" : ""}
                </span>
              </div>

              {dayMeals.length === 0 ? (
                <p className="text-xs text-cocoa-faint">비어 있어요</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {dayMeals.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      {m.slot && (
                        <span className="rounded-mochi-sm bg-lavender-soft px-1.5 py-0.5 text-[11px] text-cocoa-soft">
                          {SLOT_EMOJI[m.slot as MealSlot]} {SLOT_LABEL[m.slot as MealSlot]}
                        </span>
                      )}
                      <span>{m.emoji ?? "🍽️"}</span>
                      <span
                        className={cn("flex-1", m.eaten ? "text-cocoa-faint line-through" : "text-cocoa")}
                      >
                        {m.title}
                      </span>
                      {m.eaten ? (
                        <span className="text-xs text-cocoa-faint">먹음 ✓</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => eat.mutate(m.id)}
                            className="rounded-mochi-sm bg-mint px-2 py-0.5 text-xs text-cocoa transition-transform ease-jelly active:scale-90"
                          >
                            먹었어요
                          </button>
                          <button
                            type="button"
                            onClick={() => remove.mutate(m.id)}
                            className="px-1 text-cocoa-faint transition-transform ease-jelly active:scale-90"
                            aria-label="삭제"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
