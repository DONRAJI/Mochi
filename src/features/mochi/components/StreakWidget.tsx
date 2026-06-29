import { Card } from "@/components/ui/Card";

interface StreakWidgetProps {
  days?: number;
  shields?: number;
}

/** 스트릭 위젯 — 젤리 + 보호권. "하루 빠져도 안 깨져요"(불변 #1 부드러운 톤). */
export function StreakWidget({ days = 7, shields = 1 }: StreakWidgetProps) {
  return (
    <Card className="flex w-full items-center justify-between bg-butter-soft">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🍮</span>
        <div>
          <p className="text-sm text-cocoa-faint">연속 기록</p>
          <p className="text-lg font-bold text-cocoa">{days}일째</p>
        </div>
      </div>
      <div className="text-right text-sm text-cocoa-soft">
        <p>🛡️ 보호권 {shields}</p>
        <p className="text-xs text-cocoa-faint">하루 빠져도 안 깨져요</p>
      </div>
    </Card>
  );
}
