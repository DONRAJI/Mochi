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
import { OutsidePlaceChips, OutsideFoodList, type OutsideChoice } from "./OutsideView";
import { RecipePager } from "./RecipePager";
import { FavoritesList } from "./FavoritesList";
import { BalanceBanner } from "@/features/record/components/BalanceBanner";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { RetryNotice } from "@/components/ui/RetryNotice";
import { useRecommendations, useRecipeSearch, useToggleFavorite } from "../hooks/useRecommend";
import { matchesCookFilter } from "../cookFilter";
import { pageSlice, pageCount, clampPage } from "../paging";
import type { MealMode, RecommendationResponse } from "../types";
import type { MealsSegment } from "../data";
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

/**
 * 식단 탭의 뷰 축.
 *
 * `week`(주간 식단)를 스크롤 아래가 아니라 별도 뷰로 뺀 이유: 추천과 주간 계획이 한
 * 화면에서 서로 자리를 깎고 있었다 — 주간 식단을 빨리 보이게 하려고 추천을 6개로
 * 자르고, 그래도 주간 식단은 스크롤 아래에 있었다. 둘은 시간 축이 다르다(지금 뭐 먹지
 * vs 이번 주 짜기). 분리해도 '이번 주 식단에 담기'는 RecipeDetailModal 안에 있어
 * 추천→담기 흐름은 끊기지 않는다.
 */
type MealsView = "recommend" | "favorites" | "week";

/** 🍽️ 식단 화면 — 시드 카탈로그 실데이터를 3모드로 (불변 #5). 즐겨찾기 뷰(#7). */
export function MealsScreen() {
  const [view, setView] = useState<MealsView>("recommend");
  // 화면은 '요리 / 밖에서' 두 갈래이고, 밖에서는 장소를 고른다. 기록·즐겨찾기·상세에 쓰는 모드 값
  // (cook/eatout/convenience)은 DB와 여러 곳이 쓰므로 그대로 두고 여기서 파생한다.
  const [segment, setSegment] = useState<MealsSegment>("cook");
  const [place, setPlace] = useState<OutsideChoice>("cafe");
  const mode: MealMode =
    segment === "cook" ? "cook" : place === "convenience" ? "convenience" : "eatout";
  /** 음식 사전 목록을 보여줄 장소. 편의점은 아직 사전에 없어 기존 간편식 카탈로그를 쓴다. */
  const foodPlace = segment === "outside" && place !== "convenience" ? place : null;
  const [category, setCategory] = useState("전체");
  const [cookFilter, setCookFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecommendationResponse | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  // 음식 사전 장소를 보는 중엔 카탈로그를 받을 필요가 없다.
  const { data, isPending, isError, refetch } = useRecommendations(mode, {
    enabled: foodPlace == null,
  });
  const toggleFav = useToggleFavorite();

  // 레시피 검색(cook) — 이름 부분일치 + 상세검색(재료). 입력은 디바운스해 서버 조회.
  const [nameQuery, setNameQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [ingQuery, setIngQuery] = useState("");
  const debouncedName = useDebounced(nameQuery, 300);
  const debouncedIng = useDebounced(ingQuery, 300);
  const searchIngredients = debouncedIng
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const searchActive =
    mode === "cook" && (debouncedName.trim().length > 0 || searchIngredients.length > 0);
  const searchResult = useRecipeSearch(
    searchActive ? debouncedName : "",
    searchActive ? searchIngredients : [],
  );

  // ?open=<id> 딥링크 — 홈 '오늘의 제안' 탭 시 그 메뉴 상세가 바로 열린다(다시 찾지 않게, PRD 4.2).
  // 한 번 열고 나면 소비 처리 — 모달 닫은 뒤 데이터 갱신으로 다시 열리지 않게.
  const params = useSearchParams();
  const openId = params.get("open");
  const openConsumed = useRef(false);

  // ?view=week 딥링크 — 홈 축약 달력의 '이번 주 전체 ›'가 주간 뷰로 바로 들어온다.
  // 주간 식단을 칩 뒤로 옮긴 대가는 '존재를 잊는 것'인데, 홈에서 한 번에 닿으면 그게 상쇄된다.
  // ?open과 달리 한 번만 소비할 필요가 없다(뷰 전환은 사용자가 칩으로 되돌릴 수 있다).
  const viewParam = params.get("view");
  const viewApplied = useRef(false);
  useEffect(() => {
    if (viewParam !== "week" || viewApplied.current) return;
    setView("week");
    viewApplied.current = true;
  }, [viewParam]);
  useEffect(() => {
    if (!openId || openConsumed.current || !data) return;
    const found = data.find((r) => r.id === openId);
    if (found) {
      setSelected(found);
      openConsumed.current = true;
    }
  }, [openId, data]);

  /** 보는 목록이 바뀌면 카테고리·필터·검색을 초기화한다. */
  function resetListFilters() {
    setCategory("전체");
    setCookFilter(null);
    setNameQuery("");
    setIngQuery("");
    setAdvancedOpen(false);
  }

  function changeSegment(v: string) {
    setSegment(v as MealsSegment);
    resetListFilters();
  }

  function changePlace(next: OutsideChoice) {
    setPlace(next);
    resetListFilters();
  }

  // 요리는 정렬/필터 칩, 외식·간편식은 카테고리(subtitle)로 필터.
  const shown =
    mode === "cook"
      ? data?.filter((r) => matchesCookFilter(r, cookFilter))
      : category === "전체"
        ? data
        : data?.filter((r) => r.subtitle === category);

  // 추천은 번호 페이지로 끊는다(paging.ts) — 주간 식단 분리 후 50장이 한 줄로 이어져 길었다.
  // 목록을 바꾸는 조건(모드·카테고리·필터·검색어)이 바뀌면 1페이지로 돌아간다.
  const [page, setPage] = useState(0);
  const listKey = `${mode}|${category}|${cookFilter ?? ""}|${searchActive ? `${debouncedName}|${debouncedIng}` : ""}`;
  useEffect(() => setPage(0), [listKey]);
  const listTopRef = useRef<HTMLDivElement>(null);
  function goToPage(next: number, total: number) {
    setPage(clampPage(next, total));
    // 맨 아래 '다음'을 누른 채 새 페이지의 끝을 보게 되지 않도록 목록 첫 카드로 올린다.
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const shownCount = shown?.length ?? 0;
  const curPage = clampPage(page, shownCount); // 목록이 줄어도 "9 / 2" 같은 표시가 안 나오게
  const visible = pageSlice(shown ?? [], curPage);
  const searchItems = searchResult.data ?? [];
  const searchPage = clampPage(page, searchItems.length);
  const searchVisible = pageSlice(searchItems, searchPage);

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
        <Chip active={view === "week"} onClick={() => setView("week")}>
          🗓️ 이번 주
        </Chip>
      </div>

      {view === "week" ? (
        <WeeklyPlanCalendar />
      ) : view === "favorites" ? (
        <FavoritesList />
      ) : (
        <>
          <BalanceBanner />
          <ModeToggle value={segment} onChange={changeSegment} />
          {segment === "outside" && <OutsidePlaceChips value={place} onChange={changePlace} />}

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

          {foodPlace ? (
            <OutsideFoodList key={foodPlace} place={foodPlace} />
          ) : searchActive ? (
            // 검색 결과 뷰 — 이름/재료로 찾은 요리 (칩·주간식단은 잠시 숨겨 집중)
            <>
              {searchResult.isError && <RetryNotice onRetry={() => searchResult.refetch()} />}
              {!searchResult.isError &&
                !searchResult.isFetching &&
                (searchResult.data?.length ?? 0) === 0 && (
                  <p className="px-1 text-sm text-cocoa-soft">
                    찾는 요리가 없어요. 다른 이름이나 재료로 찾아볼까요?
                  </p>
                )}
              <div ref={listTopRef} className="flex flex-col gap-3">
                {searchVisible.map((r) => (
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
              <RecipePager
                page={searchPage}
                totalPages={pageCount(searchItems.length)}
                onChange={(p) => goToPage(p, searchItems.length)}
              />
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

              {isPending && (
                <>
                  <p className="px-1 text-sm text-cocoa-faint">{messages.empty.meals}</p>
                  {/* 카드가 나중에 끼어들며 주간 식단을 아래로 밀지 않게 자리를 잡아둔다. */}
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Skeleton key={i} className="h-[104px] w-full rounded-mochi" />
                    ))}
                  </div>
                </>
              )}
              {isError && <RetryNotice onRetry={() => refetch()} />}

              <div ref={listTopRef} className="flex flex-col gap-3">
                {visible.map((r) => (
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
              <RecipePager
                page={curPage}
                totalPages={pageCount(shownCount)}
                onChange={(p) => goToPage(p, shownCount)}
              />
            </>
          )}
        </>
      )}

      <RecipeDetailModal item={selected} mode={mode} onClose={() => setSelected(null)} />
      <AddMyRecipeSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
