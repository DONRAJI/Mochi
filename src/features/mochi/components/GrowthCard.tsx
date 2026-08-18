"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { useMochiState } from "../hooks/useMochi";
import { MAX_GROWTH_STAGE, growthMessage, growthTitle } from "../growth";
import { cn } from "@/lib/utils";

/**
 * 단계마다 방의 톤이 달라진다 — "채우면 뭔가 달라진다"를 아트 없이 보여주는 첫 장치.
 * 전부 디자인 토큰(불변 #4). 마지막 단계는 lift 그림자로 확실히 다른 자리로 만든다.
 */
const STAGE_TONE = [
  "bg-cream-100",
  "bg-mint-soft",
  "bg-lavender-soft",
  "bg-butter-soft",
  "bg-peach-soft shadow-mochi-lift",
] as const;

/**
 * 🌱 모찌 성장 — 잘 먹은 날이 쌓일수록 자란다 (growth.ts).
 *
 * 예전엔 점 5개만 있고 다 채워도 아무 일이 없었다(도착지 없는 게이지). 이제 칭호·다음 단계
 * 안내·단계별 톤이 붙어 "왜 이어가야 하는지"가 보인다. 옷 아트가 생기면 여기에 꽂는다.
 */
export function GrowthCard() {
  const { data: mochi, isPending } = useMochiState();

  if (isPending) {
    return (
      <div className="w-full rounded-mochi bg-cream-100 px-4 py-3 shadow-mochi-press">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="mt-2 h-3 w-40" />
      </div>
    );
  }

  const stage = mochi?.growthStage ?? 1;
  const mealCount = mochi?.mealCount ?? 0;
  const isMax = stage >= MAX_GROWTH_STAGE;

  return (
    <div
      className={cn(
        "w-full rounded-mochi px-4 py-3 shadow-mochi-press transition-colors ease-soft",
        STAGE_TONE[stage - 1] ?? STAGE_TONE[0],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-cocoa">
          {isMax && "✨ "}
          {growthTitle(stage)}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {Array.from({ length: MAX_GROWTH_STAGE }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                i < stage ? "bg-mint-deep" : "bg-cream-200",
              )}
            />
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-cocoa-soft">{growthMessage(mealCount)}</p>
    </div>
  );
}
