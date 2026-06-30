"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { RecommendationResponse } from "../types";

/** 레시피/메뉴 상세 — 단계(요리) 또는 매장 연결(외식·간편식) + 도감 등록 (PRD 5.3). */
export function RecipeDetailModal({
  item,
  onClose,
}: {
  item: RecommendationResponse | null;
  onClose: () => void;
}) {
  return (
    <Modal open={item !== null} onClose={onClose}>
      {item && (
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

          <Button className="mt-4 w-full">잘 먹었어요! 도감에 담기</Button>
        </>
      )}
    </Modal>
  );
}
