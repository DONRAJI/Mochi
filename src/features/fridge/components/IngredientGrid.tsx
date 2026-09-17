import { IngredientSticker } from "./IngredientSticker";
import type { IngredientResponse } from "../types";

export function IngredientGrid({
  items,
  onRemove,
  onPress,
  pressLabel,
}: {
  items: IngredientResponse[];
  onRemove?: (id: string) => void;
  /** 스티커를 눌렀을 때(냉장 ↔ 냉동 옮기기) */
  onPress?: (item: IngredientResponse) => void;
  pressLabel?: (item: IngredientResponse) => string;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((i) => (
        <IngredientSticker
          key={i.id}
          name={i.name}
          emoji={i.emoji}
          rarity={i.rarity}
          onRemove={onRemove ? () => onRemove(i.id) : undefined}
          onPress={onPress ? () => onPress(i) : undefined}
          pressLabel={pressLabel?.(i)}
        />
      ))}
    </div>
  );
}
