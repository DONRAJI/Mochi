import { Card } from "@/components/ui/Card";

interface ShelfItem {
  name: string;
  emoji: string;
}

/**
 * 유통기한 선반 — 강조색은 빨강이 아니라 복숭아톤 (불변 #1, PRD 5.2). 둘 다 비면 숨김.
 *
 * 날짜 수(D-n)는 보여주지 않는다: 담을 때 자동으로 추정한 기한(shelfLife)이 섞여 있어 정확한 날짜처럼
 * 말하면 안 된다. 이미 지난 재료는 '곧 써보면 좋아요'에 섞지 않는다 — 상했을 수 있는 걸 권하는 셈이라,
 * 따로 "한 번 확인해볼까요?"로만 짚는다(버리라고 단정하지 않음).
 */
export function ExpiryShelf({ soon, past }: { soon: ShelfItem[]; past: ShelfItem[] }) {
  if (!soon.length && !past.length) return null;
  return (
    <Card className="flex flex-col gap-3 bg-peach-soft">
      {soon.length > 0 && <Row title="곧 써보면 좋아요 🍑" items={soon} />}
      {past.length > 0 && <Row title="한 번 확인해볼까요? 🔍" items={past} />}
    </Card>
  );
}

function Row({ title, items }: { title: string; items: ShelfItem[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-cocoa">{title}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((i) => (
          <div
            key={i.name}
            className="flex min-w-fit items-center gap-1.5 rounded-mochi-sm bg-cream-50 px-3 py-1.5 text-sm text-cocoa"
          >
            <span>{i.emoji}</span>
            <span>{i.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
