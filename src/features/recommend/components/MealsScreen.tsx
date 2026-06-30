"use client";

import { useState } from "react";
import { ModeToggle } from "./ModeToggle";
import { SortFilterChips } from "./SortFilterChips";
import { RecipeCard } from "./RecipeCard";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { WeeklyPlanStrip } from "./WeeklyPlanStrip";
import { useRecommendations } from "../hooks/useRecommend";
import type { MealMode, RecommendationResponse } from "../types";
import { messages } from "@/lib/messages";

/** 🍽️ 식단 화면 — 시드 카탈로그 실데이터를 3모드로 (불변 #5). */
export function MealsScreen() {
  const [mode, setMode] = useState<MealMode>("cook");
  const [selected, setSelected] = useState<RecommendationResponse | null>(null);
  const { data, isPending, isError } = useRecommendations(mode);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title text-cocoa">오늘 뭐 먹지</h1>
      <ModeToggle value={mode} onChange={(v) => setMode(v as MealMode)} />
      <SortFilterChips />

      {isPending && <p className="px-1 text-sm text-cocoa-faint">{messages.empty.meals}</p>}
      {isError && (
        <p className="px-1 text-sm text-cocoa-soft">잠깐 못 불러왔어요. 다시 볼까요?</p>
      )}

      <div className="flex flex-col gap-3">
        {data?.map((r) => (
          <RecipeCard key={r.id} item={r} onClick={() => setSelected(r)} />
        ))}
      </div>

      <WeeklyPlanStrip />
      <RecipeDetailModal item={selected} mode={mode} onClose={() => setSelected(null)} />
    </div>
  );
}
