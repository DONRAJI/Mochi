"use client";

import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";
import { TodaySuggestionCard } from "./TodaySuggestionCard";
import { StreakWidget } from "./StreakWidget";
import { QuickActionBar } from "./QuickActionBar";
import { WeeklyPlanCalendar } from "@/features/recommend/components/WeeklyPlanCalendar";
import { PhotoRecordButton } from "@/features/record/components/PhotoRecordButton";
import { useMochiState } from "../hooks/useMochi";
import { useStreak, useBalanceNudge } from "@/features/record/hooks/useRecord";
import { messages } from "@/lib/messages";
import { cn } from "@/lib/utils";

const MAX_STAGE = 5;

const bubbleFor: Record<string, string> = {
  happy: "오늘도 잘 먹었네요, 뿌듯해요 😊",
  sleepy: "쉬어가도 괜찮아요 😴",
  idle: messages.mochi.greet,
  cheer: "잘 먹었네요! 씨앗이 쑥 자랐어요 🌱",
};

/** 🏠 홈 (모찌의 방) — 모찌 상태·스트릭이 실데이터로 반응. 숫자(체중/칼로리)는 없음(불변 #2). */
export function MochiRoom() {
  const { data: mochi } = useMochiState();
  const { data: streak } = useStreak();
  const { data: nudge } = useBalanceNudge();
  const state = mochi?.state ?? "idle";
  const stage = mochi?.growthStage ?? 1;

  // 며칠 든든했으면 모찌가 오늘 가벼운 쪽을 제안(경고 아님, PRD 11.5). 그 외엔 상태 인사.
  const bubble =
    nudge?.kind === "light" ? nudge.message : (bubbleFor[state] ?? messages.mochi.greet);

  return (
    <main className="flex flex-col items-center gap-5">
      <MochiAvatar state={state} priority />
      <MochiSpeechBubble>{bubble}</MochiSpeechBubble>

      {/* 성장 단계 — 수집할수록 모찌가 자란다 (PRD: 진행도=성장) */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-cocoa-faint">함께 자라는 중</span>
        {Array.from({ length: MAX_STAGE }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i < stage ? "bg-mint-deep" : "bg-cream-200",
            )}
          />
        ))}
      </div>
      <TodaySuggestionCard />
      {/* 이번 주 식단 — 홈에서 바로 보이게(식단탭에 숨지 않도록). 계획·먹었어요를 여기서. */}
      <div className="w-full">
        <WeeklyPlanCalendar />
      </div>
      <StreakWidget days={streak?.count ?? 0} shields={streak?.shieldCount ?? 1} />
      <QuickActionBar />
      {/* 사진 한 장으로 기록 (PRD 8-3) — 요리 안 해도 먹기→찍기→기록→모찌 칭찬 */}
      <PhotoRecordButton />
    </main>
  );
}
