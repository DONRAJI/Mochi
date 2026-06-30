import { cn } from "@/lib/utils";

type GaugeTone = "mint" | "peach" | "lavender" | "butter";

interface GaugeProps {
  value: number;
  max: number;
  tone?: GaugeTone;
  className?: string;
}

const fills: Record<GaugeTone, string> = {
  mint: "bg-mint",
  peach: "bg-peach",
  lavender: "bg-lavender",
  butter: "bg-butter-deep",
};

/** 진척도 게이지 (도감 컴플리트 등). 빨강 없이 파스텔로. width만 인라인(색은 토큰). */
export function Gauge({ value, max, tone = "mint", className }: GaugeProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn("h-3 w-full overflow-hidden rounded-mochi-sm bg-cream-200", className)}>
      <div className={cn("h-full rounded-mochi-sm", fills[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
