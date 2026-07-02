"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { useMarkMealEaten } from "@/features/record/hooks/useRecord";
import { estimateSlot, SLOT_LABEL } from "@/features/record/slot";
import { useAddPlan } from "../hooks/usePlan";
import { weekDates, WEEKDAY_LABEL } from "../week";
import type { MarkMealRequest, MealSlot } from "@/features/record/types";
import type { MealMode, RecipeIngredient, RecommendationResponse } from "../types";

/** 레시피/메뉴 상세 + '먹었어요'(기록→수집). 성공 시 모찌 cheer 축하 연출 (PRD 4.2 데일리 루프). */
export function RecipeDetailModal({
  item,
  mode,
  onClose,
}: {
  item: RecommendationResponse | null;
  mode: MealMode;
  onClose: () => void;
}) {
  const mark = useMarkMealEaten();
  const addPlan = useAddPlan();
  const result = mark.data;
  const [plannedDay, setPlannedDay] = useState<string | null>(null);
  const week = weekDates(new Date());

  function eat() {
    if (!item) return;
    mark.mutate({
      mode,
      slot: estimateSlot(new Date()), // 브라우저 로컬 시간(KST)으로 끼니 추정
      refId: item.id,
      rarity: item.rarity as MarkMealRequest["rarity"],
    });
  }

  function planTo(date: string, label: string) {
    if (!item) return;
    addPlan.mutate(
      { date, mode, refId: item.id, title: item.name, emoji: item.emoji ?? undefined },
      { onSuccess: () => setPlannedDay(label) },
    );
  }

  function close() {
    mark.reset();
    setPlannedDay(null);
    onClose();
  }

  return (
    <Modal open={item !== null} onClose={close}>
      {item &&
        (result ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <MochiAvatar state="cheer" className="h-24 w-24" />
            <p className="font-display text-lg text-cocoa">잘 먹었어요!</p>
            <p className="text-sm text-cocoa-soft">
              {SLOT_LABEL[result.slot as MealSlot]}으로{" "}
              {result.cardAcquired ? "담았어요 · 도감에 한 칸 🎉" : "기록했어요 😊"}
            </p>
            <p className="text-sm text-cocoa-faint">스트릭 {result.streakCount}일째 🍮</p>
            <Button className="w-full" onClick={close}>
              닫기
            </Button>
          </div>
        ) : (
          <>
            {item.imageUrl && (
              <div className="relative mb-3 h-40 w-full overflow-hidden rounded-mochi">
                <Image src={item.imageUrl} alt={item.name} fill sizes="100vw" className="object-cover" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-4xl">{item.emoji ?? "🍽️"}</span>
              <div>
                <h3 className="text-lg font-bold text-cocoa">{item.name}</h3>
                <p className="text-sm text-cocoa-faint">
                  {item.minutes != null ? `⏱ ${item.minutes}분 · ${item.servings}인분` : item.subtitle}
                  {item.kcal != null && ` · ${item.kcal} kcal`}
                </p>
              </div>
            </div>

            {mode === "cook" && item.ingredients.length > 0 && (
              <IngredientHints ingredients={item.ingredients} />
            )}

            {item.steps.length > 0 ? (
              <ol className="mt-4 flex flex-col gap-2">
                {item.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-cocoa-soft">
                    <span className="font-display text-cocoa">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-center text-sm text-cocoa-soft">주변 매장·배달로 바로 연결돼요</p>
            )}

            <Button className="mt-4 w-full" onClick={eat}>
              {mark.isPending ? "기록하는 중…" : "잘 먹었어요! 도감에 담기"}
            </Button>
            {mark.isError && (
              <p className="mt-2 text-center text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
            )}

            <div className="mt-4 border-t border-cream-200 pt-3">
              <p className="mb-2 text-sm text-cocoa-faint">이번 주 식단에 담기</p>
              {plannedDay ? (
                <p className="text-sm text-cocoa-soft">{plannedDay}요일 식단에 담았어요 🗓️</p>
              ) : (
                <div className="flex gap-1.5">
                  {week.map((date, i) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => planTo(date, WEEKDAY_LABEL[i])}
                      className="flex-1 rounded-mochi-sm bg-cream-200 py-2 text-sm text-cocoa transition-transform ease-jelly active:scale-90"
                    >
                      {WEEKDAY_LABEL[i]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ))}
    </Modal>
  );
}

/**
 * 재료 + 다이어트 힌트 — "냉장고 재료로 가볍게" 컨셉.
 * 가진 재료는 민트로 체크, 없어도 되는 재료엔 태그, 고열량은 가벼운 대체를 부드럽게 제안(강요 아님).
 */
function IngredientHints({ ingredients }: { ingredients: RecipeIngredient[] }) {
  const swaps = ingredients.filter((i) => i.swap);
  const optionals = ingredients.filter((i) => i.optional && !i.swap);

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-display text-cocoa">재료</p>
      <div className="flex flex-wrap gap-1.5">
        {ingredients.map((ing) => (
          <span
            key={ing.name}
            className={
              ing.owned
                ? "rounded-mochi-sm bg-mint-soft px-2.5 py-1 text-sm text-cocoa"
                : "rounded-mochi-sm bg-cream-200 px-2.5 py-1 text-sm text-cocoa-faint"
            }
          >
            {ing.owned ? "✓ " : ""}
            {ing.name}
          </span>
        ))}
      </div>

      {(swaps.length > 0 || optionals.length > 0) && (
        <div className="mt-3 rounded-mochi bg-peach-soft/60 p-3">
          <p className="mb-1.5 text-sm font-display text-cocoa">🍃 가볍게 바꿔볼까요?</p>
          <ul className="flex flex-col gap-1 text-sm text-cocoa-soft">
            {swaps.map((i) => (
              <li key={i.name}>
                <span className="text-cocoa">
                  {i.name} → {i.swap!.to}
                </span>{" "}
                · {i.swap!.note}
              </li>
            ))}
            {optionals.map((i) => (
              <li key={i.name}>{i.name}는 없어도 괜찮아요</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
