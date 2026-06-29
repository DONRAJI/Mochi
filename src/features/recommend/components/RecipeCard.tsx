import { Card } from "@/components/ui/Card";
import { Gauge } from "@/components/ui/Gauge";
import type { MockRecipe } from "../data";

/** 추천 카드 — 랭킹 뱃지 + 매칭률 + 추가구매 (PRD 5.3). */
export function RecipeCard({ recipe, onClick }: { recipe: MockRecipe; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{recipe.emoji}</span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-cocoa">{recipe.name}</p>
              <span className="rounded-mochi-sm bg-mint-soft px-2 py-0.5 text-xs text-cocoa">
                {recipe.badge}
              </span>
            </div>
            <p className="text-sm text-cocoa-faint">
              {recipe.minutes > 0 ? `⏱ ${recipe.minutes}분 · ` : ""}
              {recipe.servings}인분
            </p>
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-cocoa-soft">
            <span>매칭률</span>
            <span>{recipe.match}%</span>
          </div>
          <Gauge value={recipe.match} max={100} tone="mint" />
          {recipe.buy.length > 0 && (
            <p className="mt-2 text-xs text-cocoa-faint">추가구매: {recipe.buy.join(", ")}</p>
          )}
        </div>
      </Card>
    </button>
  );
}
