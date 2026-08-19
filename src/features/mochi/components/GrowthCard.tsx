"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { useMochiState } from "../hooks/useMochi";
import { useStreak } from "@/features/record/hooks/useRecord";
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
 * 🌱 모찌 성장 + 연속 기록 — 홈의 '진행도' 한 칸.
 *
 * 성장(누적, growth.ts)과 스트릭(연속)은 둘 다 "얼마나 해왔나"를 말하는데 홈에서 카드
 * 두 개를 따로 차지하고 있었다. 홈이 블록 9개까지 불어난 원인 중 하나 → 한 카드로 합쳤다.
 * 위: 칭호와 성장 점 · 아래: 연속 기록과 보호권.
 */
export function GrowthCard() {
  const { data: mochi, isPending } = useMochiState();
  const { data: streak, isPending: streakPending } = useStreak();

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
  const days = streak?.count ?? 0;
  const shields = streak?.shieldCount ?? 0;

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
              className={cn("h-1.5 w-1.5 rounded-full", i < stage ? "bg-mint-deep" : "bg-cream-200")}
            />
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-cocoa-soft">{growthMessage(mealCount)}</p>

      {/* 연속 기록 — "하루 빠져도 안 깨져요"(불변 #1 부드러운 톤) */}
      <div className="mt-2.5 flex items-center justify-between border-t border-cream-200 pt-2.5">
        {streakPending ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <p className="text-sm text-cocoa">🍮 연속 {days}일째</p>
        )}
        {!streakPending && (
          <p className="text-xs text-cocoa-faint">
            {shields > 0 ? `🛡️ 보호권 ${shields} · 하루 빠져도 괜찮아요` : "연속 7일이면 보호권이 생겨요"}
          </p>
        )}
      </div>
    </div>
  );
}
