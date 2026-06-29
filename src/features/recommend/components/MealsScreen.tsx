"use client";

import { useState } from "react";
import { ModeToggle } from "./ModeToggle";
import { SortFilterChips } from "./SortFilterChips";
import { RecipeCard } from "./RecipeCard";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { WeeklyPlanStrip } from "./WeeklyPlanStrip";
import { MOCK_RECIPES, type MealMode, type MockRecipe } from "../data";

/** 🍽️ 식단 화면 — 모드 흡수(요리/외식/간편식)를 한 탭에서 (불변 #5). */
export function MealsScreen() {
  const [mode, setMode] = useState<MealMode>("cook");
  const [selected, setSelected] = useState<MockRecipe | null>(null);
  const recipes = MOCK_RECIPES[mode];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-cocoa">오늘 뭐 먹지</h1>
      <ModeToggle value={mode} onChange={(v) => setMode(v as MealMode)} />
      <SortFilterChips />
      <div className="flex flex-col gap-3">
        {recipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} onClick={() => setSelected(r)} />
        ))}
      </div>
      <WeeklyPlanStrip />
      <RecipeDetailModal recipe={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
