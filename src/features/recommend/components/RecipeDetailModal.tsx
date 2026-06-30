"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { useMarkMealEaten } from "@/features/record/hooks/useRecord";
import type { MarkMealRequest } from "@/features/record/types";
import type { MealMode, RecommendationResponse } from "../types";

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
  const result = mark.data;

  function eat() {
    if (!item) return;
    mark.mutate({
      mode,
      refId: item.id,
      rarity: item.rarity as MarkMealRequest["rarity"],
    });
  }

  function close() {
    mark.reset();
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
              {result.cardAcquired ? "도감에 한 칸 채웠어요 🎉" : "오늘도 기록했어요 😊"}
            </p>
            <p className="text-sm text-cocoa-faint">스트릭 {result.streakCount}일째 🍮</p>
            <Button className="w-full" onClick={close}>
              닫기
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{item.emoji ?? "🍽️"}</span>
              <div>
                <h3 className="text-lg font-bold text-cocoa">{item.name}</h3>
                <p className="text-sm text-cocoa-faint">
                  {item.minutes != null ? `⏱ ${item.minutes}분 · ${item.servings}인분` : item.subtitle}
                </p>
              </div>
            </div>

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
          </>
        ))}
    </Modal>
  );
}
