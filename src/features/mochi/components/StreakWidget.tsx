import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface StreakWidgetProps {
  days?: number;
  shields?: number;
  /** 아직 불러오는 중 — "0일째" 같은 가짜 숫자 대신 자리만 지킨다(불변 #1). */
  loading?: boolean;
}

/** 스트릭 위젯 — 젤리 + 보호권. "하루 빠져도 안 깨져요"(불변 #1 부드러운 톤). */
export function StreakWidget({ days = 7, shields = 1, loading = false }: StreakWidgetProps) {
  return (
    <Card className="flex w-full items-center justify-between bg-butter-soft">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🍮</span>
        <div>
          <p className="text-sm text-cocoa-faint">연속 기록</p>
          {loading ? (
            <Skeleton className="mt-1 h-5 w-16" />
          ) : (
            <p className="font-display text-lg text-cocoa">{days}일째</p>
          )}
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ) : (
        <div className="text-right text-sm text-cocoa-soft">
          <p>🛡️ 보호권 {shields}</p>
          <p className="text-xs text-cocoa-faint">
            {shields > 0 ? "하루 빠져도 보호권이 지켜줘요" : "연속 7일이면 보호권이 생겨요"}
          </p>
        </div>
      )}
    </Card>
  );
}
