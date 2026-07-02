import { Gauge } from "@/components/ui/Gauge";
import { progressMessage } from "../progress";

/** 컴플리트 게이지 + 진척 넛지 (PRD 7.3 #2) — 남은 수에 따라 프레이밍이 바뀐다. */
export function CompleteGauge({ have, total }: { have: number; total: number }) {
  const message = progressMessage(have, total);
  return (
    <div className="rounded-mochi bg-cream-50 p-4 shadow-mochi-press">
      <div className="mb-1 flex justify-between text-sm text-cocoa-soft">
        <span>컬렉션</span>
        <span>
          {have}/{total}
        </span>
      </div>
      <Gauge value={have} max={total} tone="lavender" />
      {message && <p className="mt-2 text-xs text-cocoa-faint">{message}</p>}
    </div>
  );
}
