import { IngredientSticker } from "./IngredientSticker";
import type { IngredientResponse } from "../types";

export function IngredientGrid({
  items,
  onRemove,
}: {
  items: IngredientResponse[];
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((i) => (
        <IngredientSticker
          key={i.id}
          name={i.name}
          rarity={i.rarity}
          onRemove={onRemove ? () => onRemove(i.id) : undefined}
        />
      ))}
    </div>
  );
}
