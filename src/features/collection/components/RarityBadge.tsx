import { cn } from "@/lib/utils";
import type { Rarity } from "../data";

/** 등급 뱃지 — 빨강 없이 토큰 색으로 (PRD 7.1). */
const meta: Record<Rarity, { label: string; cls: string }> = {
  common: { label: "일반", cls: "bg-cream-200 text-cocoa-faint" },
  rare: { label: "레어", cls: "bg-mint-soft text-cocoa" },
  epic: { label: "에픽", cls: "bg-lavender-soft text-cocoa" },
  seasonal: { label: "한정", cls: "bg-peach-soft text-cocoa" },
};

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span className={cn("rounded-mochi-sm px-2 py-0.5 text-xs", meta[rarity].cls)}>
      {meta[rarity].label}
    </span>
  );
}
