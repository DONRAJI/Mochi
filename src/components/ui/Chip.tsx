import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipTone = "default" | "peach" | "mint" | "lavender" | "butter";

interface ChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  tone?: ChipTone;
}

const tones: Record<ChipTone, string> = {
  default: "bg-cream-200 text-cocoa-faint",
  peach: "bg-peach-soft text-cocoa",
  mint: "bg-mint-soft text-cocoa",
  lavender: "bg-lavender-soft text-cocoa",
  butter: "bg-butter-soft text-cocoa",
};

/** 작은 알약형 칩 — 필터/태그/정렬에 공용 (디자인 토큰만, 불변 #4). */
export function Chip({ children, active, onClick, tone = "default" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-mochi-sm px-3 py-1.5 text-sm shadow-mochi-press",
        active ? "bg-mint text-cocoa" : tones[tone],
      )}
    >
      {children}
    </button>
  );
}
