"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ModeToggle } from "./ModeToggle";
import { SortFilterChips } from "./SortFilterChips";
import { CategoryFilterChips } from "./CategoryFilterChips";
import { RecipeCard } from "./RecipeCard";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { RecipeSearchBar } from "./RecipeSearchBar";
import { AddMyRecipeSheet } from "./AddMyRecipeSheet";
import { WeeklyPlanCalendar } from "./WeeklyPlanCalendar";
import { FavoritesList } from "./FavoritesList";
import { BalanceBanner } from "@/features/record/components/BalanceBanner";
import { Chip } from "@/components/ui/Chip";
import { useRecommendations, useRecipeSearch, useToggleFavorite } from "../hooks/useRecommend";
import { matchesCookFilter } from "../cookFilter";
import type { MealMode, RecommendationResponse } from "../types";
import { messages } from "@/lib/messages";

/** 입력을 디바운스 — 타이핑 중 매 글자마다 조회하지 않게. */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** 🍽️ 식단 화면 — 시드 카탈로그 실데이터를 3모드로 (불변 #5). 즐겨찾기 뷰(#7). */
export function MealsScreen() {
  const [view, setView] = useState<"recommend" | "favorites">("recommend");
  const [mode, setMode] = useState<MealMode>("cook");
  const [category, setCategory] = useState("전체");
  const [cookFilter, setCookFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecommendationResponse | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [showAll, setShowAll] = useState(false); // 기본은 몇 개만 — 주간 식단이 금방 보이게
  const { data, isPending, isError } = useRecommendations(mode);
  const toggleFav = useToggleFavorite();

  // 레시피 검색(cook) — 이름 부분일치 + 상세검색(재료). 입력은 디바운스해 서버 조회.
  const [nameQuery, setNameQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [ingQuery, setIngQuery] = useState("");
  const debouncedName = useDebounced(nameQuery, 300);
  const debouncedIng = useDebounced(ingQuery, 300);
  const searchIngredients = debouncedIng.split(",").map((s) => s.trim()).filter(Boolean);
  const searchActive =
    mode === "cook" && (debouncedName.trim().length > 0 || searchIngredients.length > 0);
  const searchResult = useRecipeSearch(
    searchActive ? debouncedName : "",
    searchActive ? searchIngredients : [],
  );

  // ?open=<id> 딥링크 — 홈 '오늘의 제안' 탭 시 그 메뉴 상세가 바로 열린다(다시 찾지 않게, PRD 4.2).
  // 한 번 열고 나면 소비 처리 — 모달 닫은 뒤 데이터 갱신으로 다시 열리지 않게.
  const openId = useSearchParams().get("open");
  const openConsumed = useRef(false);
  useEffect(() => {
    if (!openId || openConsumed.current || !data) return;
    const found = data.find((r) => r.id === openId);
    if (found) {
      setSelected(found);
      openConsumed.current = true;
    }
  }, [openId, data]);

  function changeMode(v: string) {
    setMode(v as MealMode);
    setCategory("전체"); // 모드 바뀌면 카테고리 초기화
    setCookFilter(null);
    setShowAll(false);
    setNameQuery(""); // 검색 초기화
    setIngQuery("");
    setAdvancedOpen(false);
  }

  // 요리는 정렬/필터 칩, 외식·간편식은 카테고리(subtitle)로 필터.
  const shown =
    mode === "cook"
      ? data?.filter((r) => matchesCookFilter(r, cookFilter))
      : category === "전체"
        ? data
        : data?.filter((r) => r.subtitle === category);

  // 추천은 상위 몇 개만 먼저 보여주고 나머지는 '더 보기'로 — 스크롤을 짧게 유지(주간 식단 접근성).
  const RECIPE_LIMIT = 6;
  const visible = showAll ? shown : shown?.slice(0, RECIPE_LIMIT);
  const hiddenCount = (shown?.length ?? 0) - (visible?.length ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title text-cocoa">오늘 뭐 먹지</h1>

      <div className="flex gap-2">
        <Chip active={view === "recommend"} onClick={() => setView("recommend")}>
          추천
        </Chip>
        <Chip active={view === "favorites"} onClick={() => setView("favorites")}>
          ♥ 즐겨찾기
        </Chip>
      </div>

      {view === "favorites" ? (
        <FavoritesList />
      ) : (
        <>
          <BalanceBanner />
          <ModeToggle value={mode} onChange={changeMode} />

          {mode === "cook" && (
            <RecipeSearchBar
              name={nameQuery}
              onName={setNameQuery}
              advancedOpen={advancedOpen}
              onToggleAdvanced={() => setAdvancedOpen((o) => !o)}
              ingredients={ingQuery}
              onIngredients={setIngQuery}
            />
          )}

          {searchActive ? (
            // 검색 결과 뷰 — 이름/재료로 찾은 요리 (칩·주간식단은 잠시 숨겨 집중)
            <>
              {searchResult.isError && (
                <p className="px-1 text-sm text-cocoa-soft">잠깐 못 불러왔어요. 다시 볼까요?</p>
              )}
              {!searchResult.isError &&
                !searchResult.isFetching &&
                (searchResult.data?.length ?? 0) === 0 && (
                  <p className="px-1 text-sm text-cocoa-soft">
                    찾는 요리가 없어요. 다른 이름이나 재료로 찾아볼까요?
                  </p>
                )}
              <div className="flex flex-col gap-3">
                {searchResult.data?.map((r) => (
                  <RecipeCard
                    key={r.id}
                    item={r}
                    onClick={() => setSelected(r)}
                    onToggleFavorite={() =>
                      toggleFav.mutate({
                        mode: "cook",
                        refId: r.id,
                        title: r.name,
                        emoji: r.emoji ?? undefined,
                      })
                    }
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {mode === "cook" ? (
                <SortFilterChips value={cookFilter} onChange={setCookFilter} />
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
                {visible?.map((r) => (
                  <RecipeCard
                    key={r.id}
                    item={r}
                    onClick={() => setSelected(r)}
                    onToggleFavorite={() =>
                      toggleFav.mutate({
                        mode,
                        refId: r.id,
                        title: r.name,
                        emoji: r.emoji ?? undefined,
                      })
                    }
                  />
                ))}
              </div>

              {!showAll && hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="rounded-mochi bg-cream-50 px-4 py-3 text-sm text-cocoa-soft shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
                >
                  추천 {hiddenCount}개 더 보기
                </button>
              )}

              <WeeklyPlanCalendar />
            </>
          )}
        </>
      )}

      <RecipeDetailModal item={selected} mode={mode} onClose={() => setSelected(null)} />
      <AddMyRecipeSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
