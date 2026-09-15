"use client";

import { useRef, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { RetryNotice } from "@/components/ui/RetryNotice";
import { messages } from "@/lib/messages";
import { useMe } from "@/features/auth/hooks/useAuth";
import { QuickRecordSheet } from "@/features/record/components/QuickRecordSheet";
import { useFoodBrowse, FOOD_BROWSE_PAGE_SIZE } from "@/features/record/hooks/useFoodBrowse";
import { OUTSIDE_PLACES, PLACE_INFO, type OutsidePlace } from "@/features/record/outsidePlaces";
import type { FoodBrowseItem } from "@/features/record/types";
import { RecipePager } from "./RecipePager";

/**
 * 🍽️ 식단 탭 '밖에서' 갈래 — 지금 있는 곳을 고르면 그 안에서 가벼운 선택부터 보여준다.
 *
 * 외식·간편식 고정 목록(36개씩)을 대신한다. 음식 사전의 외식 데이터는 카페·디저트·버거·치킨·베이커리에
 * 몰려 있고, 다이어트하는 사람이 흔들리는 곳도 여기다(같은 카페에서 아메리카노 11kcal · 스무디 415kcal).
 * "무슨 메뉴가 있는지"는 다 알지만 "여기서 뭘 고르면 가벼운지"는 모른다 — 모찌가 대신 골라주는 자리.
 *
 * 편의점은 아직 음식 사전에 없어(가공식품 데이터는 2단계) 기존 간편식 카탈로그를 MealsScreen이 보여준다.
 */

/** '밖에서' 갈래에서 고르는 곳 — 음식 사전 장소 + 편의점(기존 간편식 카탈로그). */
export type OutsideChoice = OutsidePlace | "convenience";

const CHOICES: { value: OutsideChoice; emoji: string; label: string }[] = [
  ...OUTSIDE_PLACES.map((place) => ({ value: place, ...PLACE_INFO[place] })),
  { value: "convenience", emoji: "🏪", label: "편의점" },
];

interface OutsidePlaceChipsProps {
  value: OutsideChoice;
  onChange: (value: OutsideChoice) => void;
}

export function OutsidePlaceChips({ value, onChange }: OutsidePlaceChipsProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-sm text-cocoa-soft">지금 어디예요?</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CHOICES.map((c) => (
          <Chip key={c.value} active={value === c.value} onClick={() => onChange(c.value)}>
            {c.emoji} {c.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function servingLabel(item: FoodBrowseItem): string {
  return `${Math.round(item.servingAmount)}${item.servingUnit}`;
}

interface OutsideFoodListProps {
  place: OutsidePlace;
}

/**
 * 장소별 음식 목록 — 가벼운 순, 페이지. 누르면 그 음식이 선택된 기록 시트가 열린다(바로 '먹었어요').
 * 숫자를 숨기는(cozy) 사용자에게도 가벼운 순 정렬은 그대로 준다 — 경고가 아니라 제안이라서.
 * kcal 숫자만 detail 모드에서 보인다(서버가 결정, 불변 #2).
 * 부모가 장소를 key로 다시 그리므로 장소를 바꾸면 1페이지부터 시작한다.
 */
export function OutsideFoodList({ place }: OutsideFoodListProps) {
  const [page, setPage] = useState(0);
  const [recording, setRecording] = useState<FoodBrowseItem | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);
  const { data, isPending, isError, refetch } = useFoodBrowse(place, page);
  const { data: me } = useMe();
  const showKcal = me?.displayMode === "detail";

  const totalPages = data ? Math.max(1, Math.ceil(data.total / FOOD_BROWSE_PAGE_SIZE)) : 1;
  const { emoji } = PLACE_INFO[place];

  function goToPage(next: number) {
    setPage(Math.min(Math.max(0, next), totalPages - 1));
    // 맨 아래 '다음'을 누른 채 새 페이지의 끝을 보게 되지 않도록 목록 첫 줄로 올린다.
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div ref={listTopRef} className="flex flex-col gap-3">
      <p className="px-1 text-xs text-cocoa-faint">
        {showKcal
          ? "가벼운 것부터 · 1인분 대략값이에요(브랜드마다 크기가 달라요) · 누르면 바로 기록"
          : "가벼운 것부터 보여드려요 · 누르면 바로 기록할 수 있어요"}
      </p>

      {isError && <RetryNotice onRetry={() => refetch()} />}

      {isPending && !isError && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-mochi" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <p className="px-1 text-sm text-cocoa-soft">{messages.empty.outside}</p>
      )}

      {data?.items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setRecording(item)}
          className="w-full text-left transition-transform ease-jelly active:scale-[0.98]"
        >
          <Card className="flex items-center gap-3">
            <span className="text-2xl">{emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-cocoa">{item.name}</p>
              <p className="text-xs text-cocoa-faint">
                {[item.category, servingLabel(item)].filter(Boolean).join(" · ")}
              </p>
            </div>
            {showKcal && item.kcal != null && (
              <span className="shrink-0 text-sm text-cocoa-soft">{item.kcal}kcal</span>
            )}
          </Card>
        </button>
      ))}

      <RecipePager page={page} totalPages={totalPages} onChange={goToPage} />

      <QuickRecordSheet
        open={recording != null}
        onClose={() => setRecording(null)}
        initialFood={recording}
      />
    </div>
  );
}
