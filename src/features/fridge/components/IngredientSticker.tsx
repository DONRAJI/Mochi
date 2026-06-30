import { cn } from "@/lib/utils";
import type { MockRarity } from "../data";

interface IngredientStickerProps {
  emoji: string;
  name: string;
  rarity?: MockRarity;
}

const rarityRing: Record<MockRarity, string> = {
  common: "",
  rare: "ring-2 ring-mint-deep",
  epic: "ring-2 ring-lavender-deep",
  seasonal: "ring-2 ring-peach-deep",
};

/** 재료 스티커 카드. 희귀 재료는 테두리 반짝(빨강 없이 토큰 링으로). */
export function IngredientSticker({ emoji, name, rarity = "common" }: IngredientStickerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-mochi-sm bg-cream-50 p-3 shadow-mochi-press",
        rarityRing[rarity],
      )}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-xs text-cocoa-soft">{name}</span>
    </div>
  );
}
