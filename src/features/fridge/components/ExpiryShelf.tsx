import { Card } from "@/components/ui/Card";
import { emojiForIngredient } from "../ingredients";

interface ExpiryItem {
  name: string;
  days: number;
}

/** 유통기한 임박 선반 — 강조색은 빨강이 아니라 복숭아톤 (불변 #1, PRD 5.2). 비면 숨김. */
export function ExpiryShelf({ items }: { items: ExpiryItem[] }) {
  if (!items.length) return null;
  return (
    <Card className="bg-peach-soft">
      <p className="mb-2 text-sm font-medium text-cocoa">곧 써보면 좋아요 🍑</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((i) => (
          <div
            key={i.name}
            className="flex min-w-fit items-center gap-1.5 rounded-mochi-sm bg-cream-50 px-3 py-1.5 text-sm text-cocoa"
          >
            <span>{emojiForIngredient(i.name)}</span>
            <span>{i.name}</span>
            <span className="text-cocoa-faint">D-{i.days}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
