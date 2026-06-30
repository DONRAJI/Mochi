import { cn } from "@/lib/utils";
import { emojiForIngredient } from "../ingredients";

interface IngredientStickerProps {
  name: string;
  rarity?: string;
  onRemove?: () => void;
}

const rarityRing: Record<string, string> = {
  rare: "ring-2 ring-mint-deep",
  epic: "ring-2 ring-lavender-deep",
  seasonal: "ring-2 ring-peach-deep",
};

/** 재료 스티커 카드. 희귀 재료는 테두리 반짝(빨강 없이 토큰 링). onRemove면 ✕로 뺀다. */
export function IngredientSticker({ name, rarity = "common", onRemove }: IngredientStickerProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-mochi-sm bg-cream-50 p-3 shadow-mochi-press",
        rarityRing[rarity] ?? "",
      )}
    >
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${name} 빼기`}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cream-200 text-xs text-cocoa-faint shadow-mochi-press transition-transform ease-jelly active:scale-90"
        >
          ✕
        </button>
      )}
      <span className="text-3xl">{emojiForIngredient(name)}</span>
      <span className="text-xs text-cocoa-soft">{name}</span>
    </div>
  );
}
