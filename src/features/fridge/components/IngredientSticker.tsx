import { cn } from "@/lib/utils";
import { emojiForIngredient } from "../ingredients";

interface IngredientStickerProps {
  name: string;
  /** 서버가 재료 마스터에서 찾은 이모지 — 없으면 팔레트에서 */
  emoji?: string;
  rarity?: string;
  onRemove?: () => void;
  /** 스티커를 누르면 — 냉장고 화면에선 냉장 ↔ 냉동 옮기기 */
  onPress?: () => void;
  /** 누르면 무엇을 하는지 스크린리더용 */
  pressLabel?: string;
}

const rarityRing: Record<string, string> = {
  rare: "ring-2 ring-mint-deep",
  epic: "ring-2 ring-lavender-deep",
  seasonal: "ring-2 ring-peach-deep",
};

/**
 * 재료 스티커 카드. 희귀 재료는 테두리 반짝(빨강 없이 토큰 링). onRemove면 ✕로 뺀다.
 * ✕가 버튼이라 스티커 자체는 button 대신 role="button"(버튼 안에 버튼을 둘 수 없다).
 */
export function IngredientSticker({
  name,
  emoji,
  rarity = "common",
  onRemove,
  onPress,
  pressLabel,
}: IngredientStickerProps) {
  return (
    <div
      {...(onPress
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": pressLabel ?? name,
            onClick: onPress,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPress();
              }
            },
          }
        : {})}
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-mochi-sm bg-cream-50 p-3 shadow-mochi-press",
        onPress && "cursor-pointer transition-transform ease-jelly active:scale-95",
        rarityRing[rarity] ?? "",
      )}
    >
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`${name} 빼기`}
          className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-peach text-xs text-cocoa shadow-mochi-press transition-transform ease-jelly active:scale-90"
        >
          ✕
        </button>
      )}
      <span className="text-3xl">{emoji ?? emojiForIngredient(name)}</span>
      <span className="text-xs text-cocoa-soft">{name}</span>
    </div>
  );
}
