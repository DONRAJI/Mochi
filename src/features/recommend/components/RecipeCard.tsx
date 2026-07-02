import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Gauge } from "@/components/ui/Gauge";
import type { RecommendationResponse } from "../types";

/** 추천 카드 — 랭킹 뱃지 + (요리 모드) 매칭률·추가구매 (PRD 5.3). 우상단 하트=즐겨찾기(#7). */
export function RecipeCard({
  item,
  onClick,
  onToggleFavorite,
}: {
  item: RecommendationResponse;
  onClick?: () => void;
  onToggleFavorite?: () => void;
}) {
  return (
    <div className="relative">
      {onToggleFavorite && (
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={item.favorited ? "즐겨찾기 해제" : "즐겨찾기"}
          className={`absolute right-3 top-3 z-10 text-xl transition-transform ease-jelly active:scale-90 ${
            item.favorited ? "text-peach-deep" : "text-cocoa-faint"
          }`}
        >
          {item.favorited ? "♥" : "♡"}
        </button>
      )}
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left transition-transform ease-jelly active:scale-[0.98]"
      >
        <Card>
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-mochi-sm object-cover"
            />
          ) : (
            <span className="text-4xl">{item.emoji ?? "🍽️"}</span>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-cocoa">{item.name}</p>
              {item.hidden && (
                <span className="rounded-mochi-sm bg-butter-deep px-2 py-0.5 text-xs text-cocoa">
                  🔓 히든
                </span>
              )}
              {item.mine && (
                <span className="rounded-mochi-sm bg-lavender-soft px-2 py-0.5 text-xs text-cocoa">
                  🧑‍🍳 내 요리
                </span>
              )}
              {item.usesExpiring && (
                <span className="rounded-mochi-sm bg-peach-soft px-2 py-0.5 text-xs text-cocoa">
                  🍑 임박 재료
                </span>
              )}
              {item.badge && (
                <span className="rounded-mochi-sm bg-mint-soft px-2 py-0.5 text-xs text-cocoa">
                  {item.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-cocoa-faint">
              {item.minutes != null ? `⏱ ${item.minutes}분 · ${item.servings}인분` : item.subtitle}
              {item.kcal != null && ` · ${item.kcal} kcal`}
            </p>
          </div>
        </div>

        {item.matchRate != null && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-cocoa-soft">
              <span>매칭률</span>
              <span>{item.matchRate}%</span>
            </div>
            <Gauge value={item.matchRate} max={100} tone="mint" />
            {item.missingIngredients.length > 0 && (
              <p className="mt-2 text-xs text-cocoa-faint">
                추가구매: {item.missingIngredients.join(", ")}
              </p>
            )}
          </div>
        )}
        </Card>
      </button>
    </div>
  );
}
