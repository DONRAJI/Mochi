"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { IngredientGrid } from "./IngredientGrid";
import { ExpiryShelf } from "./ExpiryShelf";
import { TagFilterChips } from "./TagFilterChips";
import { AddIngredientFab } from "./AddIngredientFab";
import { InputMethodSheet } from "./InputMethodSheet";
import { EmptyFridgeState } from "./EmptyFridgeState";
import { FRIDGE_CATEGORIES, MOCK_INGREDIENTS, MOCK_EXPIRING } from "../data";

/** 🧊 냉장고 화면 컨테이너 (상호작용 상태 관리 — 페이지는 렌더만, structure.md). */
export function FridgeScreen() {
  const [category, setCategory] = useState<string>("전체");
  const [sheetOpen, setSheetOpen] = useState(false);

  const items =
    category === "전체"
      ? MOCK_INGREDIENTS
      : MOCK_INGREDIENTS.filter((i) => i.category === category);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-cocoa">냉장고</h1>
      <ExpiryShelf items={MOCK_EXPIRING} />
      <TagFilterChips />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FRIDGE_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>
      {items.length ? <IngredientGrid items={items} /> : <EmptyFridgeState />}
      <AddIngredientFab onClick={() => setSheetOpen(true)} />
      <InputMethodSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
