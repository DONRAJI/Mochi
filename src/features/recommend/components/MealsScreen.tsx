"use client";

import { useState } from "react";
import { ModeToggle } from "./ModeToggle";
import { SortFilterChips } from "./SortFilterChips";
import { CategoryFilterChips } from "./CategoryFilterChips";
import { RecipeCard } from "./RecipeCard";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { AddMyRecipeSheet } from "./AddMyRecipeSheet";
import { WeeklyPlanCalendar } from "./WeeklyPlanCalendar";
import { BalanceBanner } from "@/features/record/components/BalanceBanner";
import { useRecommendations } from "../hooks/useRecommend";
import type { MealMode, RecommendationResponse } from "../types";
import { messages } from "@/lib/messages";

/** 🍽️ 식단 화면 — 시드 카탈로그 실데이터를 3모드로 (불변 #5). */
export function MealsScreen() {
  const [mode, setMode] = useState<MealMode>("cook");
  const [category, setCategory] = useState("전체");
  const [selected, setSelected] = useState<RecommendationResponse | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const { data, isPending, isError } = useRecommendations(mode);

  function changeMode(v: string) {
    setMode(v as MealMode);
    setCategory("전체"); // 모드 바뀌면 카테고리 초기화
  }

  // 외식·간편식은 카테고리(subtitle)로 필터. 요리는 전체.
  const shown =
    mode === "cook" || category === "전체"
      ? data
      : data?.filter((r) => r.subtitle === category);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title text-cocoa">오늘 뭐 먹지</h1>
      <BalanceBanner />
      <ModeToggle value={mode} onChange={changeMode} />
      {mode === "cook" ? (
        <SortFilterChips />
      ) : (
        <CategoryFilterChips items={data ?? []} value={category} onChange={setCategory} />
      )}

      {mode === "cook" && (
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="rounded-mochi border border-dashed border-lavender bg-cream-50 px-4 py-3 text-sm text-cocoa-soft transition-transform ease-jelly active:scale-[0.98]"
        >
          🧑‍🍳 냉장고 재료로 내 요리 추가하기
        </button>
      )}

      {isPending && <p className="px-1 text-sm text-cocoa-faint">{messages.empty.meals}</p>}
      {isError && (
        <p className="px-1 text-sm text-cocoa-soft">잠깐 못 불러왔어요. 다시 볼까요?</p>
      )}

      <div className="flex flex-col gap-3">
        {shown?.map((r) => (
          <RecipeCard key={r.id} item={r} onClick={() => setSelected(r)} />
        ))}
      </div>

      <WeeklyPlanCalendar />
      <RecipeDetailModal item={selected} mode={mode} onClose={() => setSelected(null)} />
      <AddMyRecipeSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
