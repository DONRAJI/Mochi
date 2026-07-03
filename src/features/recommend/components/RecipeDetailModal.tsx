"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { useMarkMealEaten } from "@/features/record/hooks/useRecord";
import { estimateSlot, SLOT_LABEL } from "@/features/record/slot";
import { useAddPlan } from "../hooks/usePlan";
import { useAddShopping } from "@/features/fridge/hooks/useShopping";
import { weekDates, WEEKDAY_LABEL } from "../week";
import { deliverySearchUrl } from "../delivery";
import type { MarkMealRequest, MealSlot } from "@/features/record/types";
import type { MealMode, RecipeIngredient, RecommendationResponse } from "../types";

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

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
  const addShopping = useAddShopping();
  const result = mark.data;
  const [plannedDay, setPlannedDay] = useState<string | null>(null);
  const [shopped, setShopped] = useState(false);
  const [slot, setSlot] = useState<MealSlot>(estimateSlot(new Date())); // 자동추정, 바꿀 수 있음
  const week = weekDates(new Date());

  function eat() {
    if (!item) return;
    mark.mutate({
      mode,
      slot, // 자동추정값 또는 사용자가 고른 끼니 (PRD 11.2)
      refId: item.id,
      rarity: item.rarity as MarkMealRequest["rarity"],
    });
  }

  function planTo(date: string, label: string) {
    if (!item) return;
    addPlan.mutate(
      { date, slot, mode, refId: item.id, title: item.name, emoji: item.emoji ?? undefined },
      { onSuccess: () => setPlannedDay(`${label}요일 ${SLOT_LABEL[slot]}`) },
    );
  }

  function close() {
    mark.reset();
    setPlannedDay(null);
    setShopped(false);
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
            {result.shieldUsed && (
              <p className="text-sm text-cocoa-soft">🛡️ 보호권이 스트릭을 지켜줬어요!</p>
            )}
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
            ) : mode === "eatout" ? (
              <a
                href={deliverySearchUrl(item.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-mochi bg-mint px-4 py-3 text-center text-sm text-cocoa shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
              >
                🛵 배달로 주문하기
              </a>
            ) : (
              <p className="mt-4 text-center text-sm text-cocoa-soft">가까운 편의점에서 만나요 🏪</p>
            )}

            <div className="mt-4 flex items-center gap-1.5">
              <span className="text-xs text-cocoa-faint">끼니</span>
              {SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={`rounded-mochi-sm px-2 py-0.5 text-xs transition-transform ease-jelly active:scale-90 ${
                    slot === s ? "bg-mint text-cocoa" : "bg-cream-200 text-cocoa-faint"
                  }`}
                >
                  {SLOT_LABEL[s]}
                </button>
              ))}
            </div>

            <Button className="mt-2 w-full" onClick={eat}>
              {mark.isPending ? "기록하는 중…" : "잘 먹었어요! 도감에 담기"}
            </Button>
            {mark.isError && (
              <p className="mt-2 text-center text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
            )}

            {mode === "cook" &&
              item.missingIngredients.length > 0 &&
              (shopped ? (
                <p className="mt-2 text-center text-sm text-cocoa-soft">장보기 리스트에 담았어요 🛒</p>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    addShopping.mutate(item.missingIngredients, { onSuccess: () => setShopped(true) })
                  }
                  className="mt-2 w-full rounded-mochi border border-dashed border-mint-deep bg-cream-50 px-4 py-2.5 text-sm text-cocoa-soft transition-transform ease-jelly active:scale-[0.98]"
                >
                  🛒 추가구매 {item.missingIngredients.length}개 장보기에 담기
                </button>
              ))}

            <div className="mt-4 border-t border-cream-200 pt-3">
              <p className="mb-2 text-sm text-cocoa-faint">
                이번 주 식단에 담기 · <span className="text-cocoa">{SLOT_LABEL[slot]}</span>
              </p>
              {plannedDay ? (
                <p className="text-sm text-cocoa-soft">{plannedDay}에 담았어요 🗓️</p>
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
