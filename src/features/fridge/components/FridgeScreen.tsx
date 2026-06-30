"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { IngredientGrid } from "./IngredientGrid";
import { ExpiryShelf } from "./ExpiryShelf";
import { TagFilterChips } from "./TagFilterChips";
import { AddIngredientFab } from "./AddIngredientFab";
import { AddIngredientSheet } from "./AddIngredientSheet";
import { EmptyFridgeState } from "./EmptyFridgeState";
import { useIngredients, useRemoveIngredient } from "../hooks/useFridge";
import { FRIDGE_CATEGORIES } from "../data";

const DAY_MS = 86_400_000;

/** 🧊 냉장고 화면 — 실데이터. 재료를 담으면 식단(추천) 매칭률이 자동 점등(쿼리 무효화). */
export function FridgeScreen() {
  const [category, setCategory] = useState<string>("전체");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isPending, isError } = useIngredients();
  const remove = useRemoveIngredient();

  const all = data ?? [];
  const items = category === "전체" ? all : all.filter((i) => i.category === category);
  const expiring = all
    .filter((i) => i.expiresAt)
    .map((i) => ({
      name: i.name,
      days: Math.max(0, Math.ceil((new Date(i.expiresAt as string).getTime() - Date.now()) / DAY_MS)),
    }))
    .filter((i) => i.days <= 3);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title text-cocoa">냉장고</h1>
      <ExpiryShelf items={expiring} />
      <TagFilterChips />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FRIDGE_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>

      {isError && (
        <p className="px-1 text-sm text-cocoa-soft">로그인하면 냉장고를 채울 수 있어요.</p>
      )}
      {!isError &&
        (all.length > 0 ? (
          <IngredientGrid items={items} onRemove={(id) => remove.mutate(id)} />
        ) : (
          !isPending && <EmptyFridgeState />
        ))}

      <AddIngredientFab onClick={() => setSheetOpen(true)} />
      <AddIngredientSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
