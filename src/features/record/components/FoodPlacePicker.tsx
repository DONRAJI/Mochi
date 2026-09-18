"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { RetryNotice } from "@/components/ui/RetryNotice";
import { messages } from "@/lib/messages";
import { PORTION_LABEL } from "@/lib/portion";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useFoodBrowse, FOOD_BROWSE_PAGE_SIZE } from "../hooks/useFoodBrowse";
import { OUTSIDE_PLACES, PLACE_INFO, type OutsidePlace } from "../outsidePlaces";
import { RecipePager } from "@/features/recommend/components/RecipePager";
import type { FoodBrowseItem } from "../types";

/**
 * 🏪 밖에서 먹은 것 고르기 — 장소를 누르면 그 장소의 대표 메뉴가 뜨고, 누르면 그 음식이 골라진다.
 *
 * 왜 기록 안에 있는가(2026-09-18): 예전엔 식단 탭의 '밖에서' 갈래였는데, 밖에서 먹는 순간은
 * **제안받는 순간이 아니라 기록하는 순간**이다 — 메뉴판이 이미 눈앞에 있고, 앱은 그 가게에 뭐가
 * 있는지 모른다. 그래서 제안 탭에서 빼고 기록 시트 안으로 옮겼다. 이름을 몰라도 장소 → 메뉴
 * 두 번 탭으로 기록이 끝나고, 고르는 순간 양감 라벨(🍃 가볍게)이 판단 재료로 보인다.
 *
 * 브랜드로 나누지 않는다 — 중요한 건 '무엇을 먹었나'지 어느 가게냐가 아니다(2026-09-18 사용자 결정).
 * 브랜드는 대중성(여러 곳에서 파는 메뉴 = 흔한 메뉴)을 셀 때만 쓰고 화면에는 내지 않는다.
 */

/** 편의점 가공식품 분류는 원본 이름이 딱딱해서("주먹밥/김밥/초밥") 보여줄 이름·아이콘을 따로 둔다. */
const CONVENIENCE_LOOK: Record<string, { emoji: string; label: string }> = {
  "주먹밥/김밥/초밥": { emoji: "🍙", label: "김밥·주먹밥" },
  도시락: { emoji: "🍱", label: "도시락" },
  샌드위치: { emoji: "🥪", label: "샌드위치" },
};

function servingLabel(item: FoodBrowseItem): string {
  return `${Math.round(item.servingAmount)}${item.servingUnit}`;
}

interface FoodPlacePickerProps {
  /** 음식을 고르면 — 편의점이면 간편식, 그 밖의 장소면 외식으로 기록한다(호출부가 판단) */
  onPick: (item: FoodBrowseItem, place: OutsidePlace) => void;
}

export function FoodPlacePicker({ onPick }: FoodPlacePickerProps) {
  const [place, setPlace] = useState<OutsidePlace | null>(null);
  const [page, setPage] = useState(0);
  const { data, isPending, isError, refetch } = useFoodBrowse(place, page);
  const { data: me } = useMe();
  const showKcal = me?.displayMode === "detail";

  const totalPages = data ? Math.max(1, Math.ceil(data.total / FOOD_BROWSE_PAGE_SIZE)) : 1;
  const isConvenience = place === "convenience";

  function choosePlace(next: OutsidePlace) {
    setPlace((cur) => (cur === next ? null : next)); // 같은 칩을 다시 누르면 접는다
    setPage(0);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {OUTSIDE_PLACES.map((p) => (
          <Chip key={p} active={place === p} onClick={() => choosePlace(p)}>
            {PLACE_INFO[p].emoji} {PLACE_INFO[p].label}
          </Chip>
        ))}
      </div>

      {place && (
        <>
          <p className="px-1 text-xs text-cocoa-faint">
            여러 곳에서 파는 대표 메뉴 · 가벼운 것부터 · 누르면 골라져요
          </p>

          {isError && <RetryNotice onRetry={() => refetch()} />}

          {isPending && !isError && (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-mochi-sm" />
              ))}
            </div>
          )}

          {data && data.items.length === 0 && (
            <p className="px-1 text-sm text-cocoa-soft">{messages.empty.outside}</p>
          )}

          <div className="flex flex-col gap-1.5">
            {data?.items.map((item) => {
              const look =
                isConvenience && item.category ? CONVENIENCE_LOOK[item.category] : undefined;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPick(item, place)}
                  className="flex items-center gap-2 rounded-mochi-sm bg-cream-100 px-3 py-2 text-left text-sm text-cocoa transition-transform ease-jelly active:scale-[0.98]"
                >
                  <span className="text-base">{look?.emoji ?? PLACE_INFO[place].emoji}</span>
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <span className="shrink-0 text-xs text-cocoa-faint">
                    {[
                      servingLabel(item),
                      showKcal && item.kcal != null
                        ? `${item.kcal}kcal`
                        : item.portion
                          ? PORTION_LABEL[item.portion]
                          : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              );
            })}
          </div>

          <RecipePager
            page={page}
            totalPages={totalPages}
            onChange={(p) => setPage(Math.min(Math.max(0, p), totalPages - 1))}
          />
        </>
      )}
    </div>
  );
}
