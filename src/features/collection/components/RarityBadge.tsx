import { cn } from "@/lib/utils";

/** 등급 뱃지 — 빨강 없이 토큰 색으로 (PRD 7.1). 알 수 없는 등급은 일반으로 폴백. */
const meta: Record<string, { label: string; cls: string }> = {
  common: { label: "일반", cls: "bg-cream-200 text-cocoa-faint" },
  rare: { label: "레어", cls: "bg-mint-soft text-cocoa" },
  epic: { label: "에픽", cls: "bg-lavender-soft text-cocoa" },
  legendary: { label: "전설", cls: "bg-butter-soft text-cocoa" },
  seasonal: { label: "한정", cls: "bg-peach-soft text-cocoa" },
};

export function RarityBadge({ rarity }: { rarity: string }) {
  const m = meta[rarity] ?? meta.common;
  return <span className={cn("rounded-mochi-sm px-2 py-0.5 text-xs", m.cls)}>{m.label}</span>;
}
