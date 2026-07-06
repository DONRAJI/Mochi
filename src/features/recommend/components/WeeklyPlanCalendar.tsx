"use client";

import { useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import { cn } from "@/lib/utils";
import { weekDates, ymd, WEEKDAY_LABEL } from "../week";
import {
  usePlanWeek,
  useRemovePlan,
  useEatPlan,
  useAutoFillWeek,
  useMovePlan,
} from "../hooks/usePlan";
import { SLOT_LABEL, SLOT_EMOJI } from "@/features/record/slot";
import type { MealSlot } from "@/features/record/types";
import type { PlannedMealResponse } from "../plan";

/** 아침→점심→저녁→간식 순으로 정렬(끼니 없는 건 뒤로) — 식단표처럼 보이게. */
const SLOT_ORDER: Record<MealSlot, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
const slotRank = (s: MealSlot | null) => (s ? SLOT_ORDER[s] : 9);

/** 드롭 위치(포인터)를 viewport 좌표로 — getBoundingClientRect와 같은 기준. */
function clientXY(e: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } {
  if ("clientX" in e && typeof e.clientX === "number") return { x: e.clientX, y: e.clientY };
  const t = (e as TouchEvent).changedTouches?.[0];
  return { x: t?.clientX ?? 0, y: t?.clientY ?? 0 };
}

/**
 * 주간 식단 캘린더 (PRD 4.3·5.3) — 이번 주(월~일) 계획을 실데이터로.
 * 추천/상세에서 "이 날에 담기"로 채우고, 계획을 '먹었어요'하면 기록 루프로 이어진다.
 * 끼니 카드를 **끌어서 다른 날로 재배치**(PRD 5.3). 숫자(칼로리)는 없음(불변 #2).
 */
export function WeeklyPlanCalendar() {
  const week = weekDates(new Date());
  const today = ymd(new Date());
  const { data: meals } = usePlanWeek();
  const remove = useRemovePlan();
  const eat = useEatPlan();
  const autoFill = useAutoFillWeek();
  const move = useMovePlan();

  // 날짜별 컨테이너 ref — 드롭 시 포인터가 어느 날 위에 있는지 히트테스트.
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  function resolveDate(x: number, y: number): string | null {
    for (const [date, el] of Object.entries(dayRefs.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return date;
    }
    return null;
  }

  const byDate = new Map<string, PlannedMealResponse[]>();
  for (const m of meals ?? []) {
    const arr = byDate.get(m.date) ?? [];
    arr.push(m);
    byDate.set(m.date, arr);
  }
  // 각 날짜의 끼니를 아침→점심→저녁 순으로 정렬.
  for (const arr of byDate.values()) arr.sort((a, b) => slotRank(a.slot) - slotRank(b.slot));
  const hasEmpty = week.some((d) => !byDate.has(d));
  const hasMovable = (meals ?? []).some((m) => !m.eaten);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm text-cocoa-faint">이번 주 식단</p>
          {hasMovable && <p className="text-[11px] text-cocoa-faint">⠿ 끌어서 다른 날로 옮겨요</p>}
        </div>
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
              ref={(el) => {
                dayRefs.current[date] = el;
              }}
              className={cn(
                "rounded-mochi px-3 py-2 shadow-mochi-press",
                isToday ? "bg-mint-soft" : "bg-cream-100",
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
                    <DraggableMeal
                      key={m.id}
                      meal={m}
                      resolveDate={resolveDate}
                      onMove={(id, targetDate) => move.mutate({ id, date: targetDate })}
                      onEat={(id) => eat.mutate(id)}
                      onRemove={(id) => remove.mutate(id)}
                    />
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

/** 끼니 카드 — 핸들(⠿)을 잡아야 드래그 시작(모바일 스크롤과 충돌 방지). 드롭한 날로 이동. */
function DraggableMeal({
  meal,
  resolveDate,
  onMove,
  onEat,
  onRemove,
}: {
  meal: PlannedMealResponse;
  resolveDate: (x: number, y: number) => string | null;
  onMove: (id: string, date: string) => void;
  onEat: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const controls = useDragControls();

  return (
    <motion.div
      drag={!meal.eaten}
      dragControls={controls}
      dragListener={false}
      dragSnapToOrigin
      dragMomentum={false}
      whileDrag={{ scale: 1.04, zIndex: 50 }}
      onDragEnd={(event) => {
        const { x, y } = clientXY(event);
        const target = resolveDate(x, y);
        if (target && target !== meal.date) onMove(meal.id, target);
      }}
      className="relative flex items-center gap-2 rounded-mochi-sm bg-cream-50 px-2 py-1.5 text-sm shadow-mochi-press"
    >
      {!meal.eaten && (
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className="touch-none cursor-grab px-0.5 text-cocoa-faint"
          aria-label="끌어서 옮기기"
        >
          ⠿
        </button>
      )}
      {meal.slot && (
        <span className="rounded-mochi-sm bg-lavender-soft px-1.5 py-0.5 text-[11px] text-cocoa-soft">
          {SLOT_EMOJI[meal.slot as MealSlot]} {SLOT_LABEL[meal.slot as MealSlot]}
        </span>
      )}
      <span>{meal.emoji ?? "🍽️"}</span>
      <span className={cn("flex-1", meal.eaten ? "text-cocoa-faint line-through" : "text-cocoa")}>
        {meal.title}
      </span>
      {meal.eaten ? (
        <span className="text-xs text-cocoa-faint">먹음 ✓</span>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onEat(meal.id)}
            className="rounded-mochi-sm bg-mint px-2 py-0.5 text-xs text-cocoa transition-transform ease-jelly active:scale-90"
          >
            먹었어요
          </button>
          <button
            type="button"
            onClick={() => onRemove(meal.id)}
            className="px-1 text-cocoa-faint transition-transform ease-jelly active:scale-90"
            aria-label="삭제"
          >
            ✕
          </button>
        </>
      )}
    </motion.div>
  );
}
