"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { useMochiState } from "../hooks/useMochi";
import { useStreak } from "@/features/record/hooks/useRecord";
import { MAX_GROWTH_STAGE, growthMessage, growthTitle, streakNote } from "../growth";
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
 * 위: 칭호와 성장 점 · 아래: 잘 먹은 날(누적, 주인공) + 이어가는 중일 때만 연속 기록(보조, growth.streakNote).
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
  const goodDays = mochi?.goodDays ?? 0;
  const note = streak ? streakNote(streak.count, streak.shieldCount) : null;

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

      {/* 잘 먹은 날(누적) — 줄지 않는다. 연속 기록은 이어가는 동안만 옆에 작게(끊겨도 '1일'을 보여주지 않음). */}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-cream-200 pt-2.5">
        <p className="text-sm text-cocoa">🌱 잘 먹은 날 {goodDays}일</p>
        {streakPending ? (
          <Skeleton className="h-3 w-20" />
        ) : (
          note && <p className="truncate text-xs text-cocoa-faint">{note}</p>
        )}
      </div>
    </div>
  );
}
