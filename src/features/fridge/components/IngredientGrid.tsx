import { IngredientSticker } from "./IngredientSticker";
import type { MockIngredient } from "../data";

/** 재료 그리드 (PRD 5.2). */
export function IngredientGrid({ items }: { items: MockIngredient[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((i) => (
        <IngredientSticker key={i.id} emoji={i.emoji} name={i.name} rarity={i.rarity} />
      ))}
    </div>
  );
}
