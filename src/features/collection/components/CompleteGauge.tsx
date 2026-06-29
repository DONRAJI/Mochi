import { Gauge } from "@/components/ui/Gauge";

/** 컴플리트 게이지 + "앞으로 N개!" 넛지 (PRD 7.3). */
export function CompleteGauge({ have, total }: { have: number; total: number }) {
  const left = total - have;
  return (
    <div className="rounded-mochi bg-cream-50 p-4 shadow-mochi-press">
      <div className="mb-1 flex justify-between text-sm text-cocoa-soft">
        <span>컬렉션</span>
        <span>
          {have}/{total}
        </span>
      </div>
      <Gauge value={have} max={total} tone="lavender" />
      {left > 0 && <p className="mt-2 text-xs text-cocoa-faint">앞으로 {left}개만 더! 🌸</p>}
    </div>
  );
}
