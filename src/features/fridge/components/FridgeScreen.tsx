"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { RetryNotice } from "@/components/ui/RetryNotice";
import { IngredientGrid } from "./IngredientGrid";
import { ExpiryShelf } from "./ExpiryShelf";
import { AddIngredientFab } from "./AddIngredientFab";
import { AddIngredientSheet } from "./AddIngredientSheet";
import { ShoppingList } from "./ShoppingList";
import { EmptyFridgeState } from "./EmptyFridgeState";
import { useIngredients, useRemoveIngredient } from "../hooks/useFridge";
import { daysUntil, isExpiringSoon } from "../expiry";
import { FRIDGE_CATEGORIES } from "../data";

/** 🧊 냉장고 화면 — 실데이터. 재료를 담으면 식단(추천) 매칭률이 자동 점등(쿼리 무효화). */
export function FridgeScreen() {
  const [category, setCategory] = useState<string>("전체");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isPending, isError, refetch } = useIngredients();
  const remove = useRemoveIngredient();

  const all = data ?? [];
  const items = category === "전체" ? all : all.filter((i) => i.category === category);
  const now = new Date();
  const expiring = all
    .filter((i) => isExpiringSoon(i.expiresAt, now))
    .map((i) => ({ name: i.name, days: Math.max(0, daysUntil(i.expiresAt, now) ?? 0) }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title text-cocoa">냉장고</h1>
      <ExpiryShelf items={expiring} />
      {/* 선호/비선호/알러지 필터 칩(PRD 5.2)은 제거 — 재료에 태그가 배선돼 있지 않아 누르면
          동작하는 척만 하는 장식이었다(정직화). 취향 태그의 소유처는 마이 탭 PreferencesSection. */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FRIDGE_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>

      {/* 미인증(401)은 전역에서 로그인으로 안내하므로, 여기 남는 건 잠깐 못 불러온 경우다. */}
      {isError && <RetryNotice onRetry={() => refetch()} />}
      {!isError &&
        (isPending ? (
          // 담아둔 재료가 있는데도 '비었다'는 안내가 먼저 뜨는 걸 막는다(불변 #1).
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-mochi" />
            ))}
          </div>
        ) : all.length > 0 ? (
          <IngredientGrid items={items} onRemove={(id) => remove.mutate(id)} />
        ) : (
          <EmptyFridgeState />
        ))}

      <ShoppingList />

      <AddIngredientFab onClick={() => setSheetOpen(true)} />
      <AddIngredientSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
