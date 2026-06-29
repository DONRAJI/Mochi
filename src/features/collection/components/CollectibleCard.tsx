import { cn } from "@/lib/utils";
import { RarityBadge } from "./RarityBadge";
import type { MockCollectible } from "../data";

/** 수집 카드 — 획득=풀컬러, 미획득=실루엣+❓ 티저 (PRD 7.3). */
export function CollectibleCard({
  item,
  onClick,
}: {
  item: MockCollectible;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={item.acquired ? onClick : undefined}
      className={cn(
        "flex flex-col items-center gap-1 rounded-mochi-sm bg-cream-50 p-3 shadow-mochi-press",
        !item.acquired && "opacity-50",
      )}
    >
      <span className="text-3xl">{item.acquired ? item.emoji : "❓"}</span>
      <span className="text-xs text-cocoa-soft">{item.acquired ? item.name : "???"}</span>
      {item.acquired && <RarityBadge rarity={item.rarity} />}
    </button>
  );
}
