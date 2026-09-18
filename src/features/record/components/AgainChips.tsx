"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFrequentMeals, useMarkMealEaten } from "../hooks/useRecord";
import { estimateSlot } from "../slot";
import type { FrequentMeal } from "../frequent";

/**
 * 🍽️ '또 먹었어요' — 자주 먹는 것 한 번 탭으로 기록 (홈).
 *
 * 왜: 기록이 버튼 → 입력창 → 이름 입력 → 저장이라, 매일 비슷하게 먹는 사람에겐 그 과정 자체가 일이었다.
 * 자주 먹은 것 세 개를 홈에 두고 한 번 탭으로 끝낸다. 기록이 없는 사람에겐 아무것도 그리지 않는다
 * (빈 자리를 만들지 않는다 — 첫 안내가 그 자리를 맡는다).
 * 홈이라 숫자는 쓰지 않는다(불변 #2) — 이름만.
 */
export function AgainChips() {
  const { data, isPending } = useFrequentMeals();
  const mark = useMarkMealEaten();
  const [justAdded, setJustAdded] = useState<string | null>(null);

  if (isPending) return <Skeleton className="h-8 w-full" />;
  if (!data || data.length === 0) return null;

  function record(meal: FrequentMeal) {
    mark.mutate(
      {
        mode: meal.mode,
        slot: estimateSlot(new Date()),
        rarity: "common",
        ...(meal.refId ? { refId: meal.refId } : { title: meal.title }),
      },
      {
        onSuccess: () => {
          setJustAdded(meal.key);
          setTimeout(() => setJustAdded(null), 2000);
        },
      },
    );
  }

  return (
    <section className="w-full">
      <p className="mb-2 text-sm text-cocoa-faint">또 먹었어요 — 누르면 바로 기록</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {data.map((meal) => (
          <button
            key={meal.key}
            type="button"
            onClick={() => record(meal)}
            className="shrink-0 rounded-mochi-sm bg-cream-50 px-3 py-2 text-sm text-cocoa shadow-mochi-press transition-transform ease-jelly active:scale-95"
          >
            {justAdded === meal.key ? `${meal.title} ✓` : `🍽️ ${meal.title}`}
          </button>
        ))}
      </div>
    </section>
  );
}
