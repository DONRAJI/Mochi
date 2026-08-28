"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useDragControls } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";
import { PresetSheet } from "./PresetSheet";
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
interface WeeklyPlanCalendarProps {
  /**
   * 홈에서 쓰는 축약 모드 — 오늘·내일만 보여주고 전체는 식단 탭으로 넘긴다.
   * 홈은 "모찌의 방"인데 7일치 목록이 화면의 절반을 먹고 있었고, 같은 달력이 식단 탭에도
   * 그대로 있어 중복이었다(PRD 3장 홈 명세는 원래 모찌·제안·스트릭·빠른액션 4개).
   */
  compact?: boolean;
}

export function WeeklyPlanCalendar({ compact = false }: WeeklyPlanCalendarProps) {
  const router = useRouter();

  /**
   * ⚠️ 날짜는 **마운트 후에만** 정한다 — 렌더 중에 `new Date()`를 부르면 안 된다.
   *
   * 홈(`/`)은 빌드 시점에 정적 프리렌더되므로, 렌더 중 날짜를 계산하면 **빌드한 날의
   * 요일·날짜가 HTML에 그대로 구워진다**(실제로 index.html에 "금 28일 · 오늘"이 박혀 있었다).
   * 사용자가 다른 날 홈을 열면 서버 텍스트와 클라 첫 렌더 텍스트가 달라
   * **React #418(하이드레이션 불일치)** 이 나고, 그 트리가 통째로 재생성되며 깜빡인다.
   * 빌드 머신은 UTC라 KST 자정~오전 9시엔 배포 당일에도 어긋난다.
   *
   * conventions.md의 "첫 렌더는 기본값으로 그리고 마운트 후 하이드레이트"를 그대로 따른다.
   */
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const fullWeek = now ? weekDates(now) : [];
  const today = now ? ymd(now) : "";
  // 축약 모드는 오늘부터 2일. 주말이라 남은 날이 하루뿐이면 그 하루만.
  const todayIndex = fullWeek.indexOf(today);
  const week = compact && todayIndex >= 0 ? fullWeek.slice(todayIndex, todayIndex + 2) : fullWeek;
  const { data: meals, isPending } = usePlanWeek();
  const remove = useRemovePlan();
  const eat = useEatPlan();
  const autoFill = useAutoFillWeek();
  const move = useMovePlan();

  // 날짜별 컨테이너 ref — 드롭 시 포인터가 어느 날 위에 있는지 히트테스트.
  // 프리셋은 '한 주 전체'를 다루는 기능이라 축약 모드(홈)에선 띄우지 않는다.
  const [presetOpen, setPresetOpen] = useState(false);
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
  // 불러오기 전엔 모든 날이 비어 보이므로, 그 상태로 '자동 채우기'를 띄웠다 감추면 깜빡인다.
  const hasEmpty = !isPending && week.some((d) => !byDate.has(d));
  const hasMovable = (meals ?? []).some((m) => !m.eaten);

  // 날짜가 정해지기 전(= 프리렌더·첫 렌더)엔 자리만 지킨다. 빌드 시점 날짜는 '가짜 값'이라
  // 그리지 않는다 — 값이 오기 전 가짜를 먼저 그리지 않는 Skeleton 원칙과 같은 축이다.
  // 훅은 위에서 전부 호출한 뒤라 순서가 흔들리지 않는다.
  if (!now) {
    return (
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-cocoa-faint">{compact ? "다가오는 끼니" : "이번 주 식단"}</p>
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: compact ? 2 : 7 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm text-cocoa-faint">{compact ? "다가오는 끼니" : "이번 주 식단"}</p>
          {/* 드래그 안내와 자동 채우기는 '한 주'를 다루는 기능이라 축약 모드에선 감춘다. */}
          {!compact && hasMovable && (
            <p className="text-[11px] text-cocoa-faint">⠿ 끌어서 다른 날로 옮겨요</p>
          )}
        </div>
        {compact ? (
          <button
            type="button"
            onClick={() => router.push("/meals")}
            className="rounded-mochi-sm bg-cream-100 px-2.5 py-1 text-xs text-cocoa-soft transition-transform ease-jelly active:scale-90"
          >
            이번 주 전체 ›
          </button>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPresetOpen(true)}
              className="rounded-mochi-sm bg-cream-100 px-2.5 py-1 text-xs text-cocoa-soft transition-transform ease-jelly active:scale-90"
            >
              🔖 프리셋
            </button>
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
        )}
      </div>
      <div className="flex flex-col gap-2">
        {week.map((date) => {
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
                {/* 요일은 '이번 주 안에서의 위치'로 찾는다 — 축약 모드는 week가 잘려 있어
                    map의 인덱스를 쓰면 항상 월·화로 표시된다. */}
                <span className="font-display text-sm text-cocoa">
                  {WEEKDAY_LABEL[fullWeek.indexOf(date)]}
                </span>
                <span className="text-xs text-cocoa-faint">
                  {Number(date.slice(8, 10))}일{isToday ? " · 오늘" : ""}
                </span>
              </div>

              {dayMeals.length === 0 ? (
                // 아직 모르는 걸 "비어 있어요"라고 단정하지 않는다 — 계획이 있는데도 비었다고
                // 보였다가 채워지면, 그 찰나가 "아무것도 안 했다"로 읽힌다(불변 #1).
                isPending ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <p className="text-xs text-cocoa-faint">비어 있어요</p>
                )
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

      {!compact && (
        <PresetSheet open={presetOpen} onClose={() => setPresetOpen(false)} week={fullWeek} />
      )}
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
