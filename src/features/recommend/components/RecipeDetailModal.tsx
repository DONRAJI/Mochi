"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { MockRecipe } from "../data";

/** 레시피/메뉴 상세 — 단계 + (예정)StepTimer + 도감 등록 (PRD 5.3). */
export function RecipeDetailModal({
  recipe,
  onClose,
}: {
  recipe: MockRecipe | null;
  onClose: () => void;
}) {
  return (
    <Modal open={recipe !== null} onClose={onClose}>
      {recipe && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{recipe.emoji}</span>
            <div>
              <h3 className="text-lg font-bold text-cocoa">{recipe.name}</h3>
              <p className="text-sm text-cocoa-faint">
                {recipe.minutes > 0 ? `⏱ ${recipe.minutes}분 · ` : ""}
                {recipe.servings}인분
              </p>
            </div>
          </div>
          <ol className="mt-4 flex flex-col gap-2">
            {recipe.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-cocoa-soft">
                <span className="font-bold text-cocoa">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-mochi-sm bg-lavender-soft px-3 py-2 text-center text-sm text-cocoa">
            ⏲ 단계 타이머는 곧 들어와요
          </div>
          <Button className="mt-4 w-full">다 했어요! 도감에 담기</Button>
        </>
      )}
    </Modal>
  );
}
