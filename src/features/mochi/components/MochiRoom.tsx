"use client";

import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";
import { TodaySuggestionCard } from "./TodaySuggestionCard";
import { StreakWidget } from "./StreakWidget";
import { QuickActionBar } from "./QuickActionBar";
import { useMochiState } from "../hooks/useMochi";
import { useStreak } from "@/features/record/hooks/useRecord";
import { messages } from "@/lib/messages";

const bubbleFor: Record<string, string> = {
  happy: "오늘도 잘 먹었네요, 뿌듯해요 😊",
  sleepy: "쉬어가도 괜찮아요 😴",
  idle: messages.mochi.greet,
  cheer: "도감이 한 칸 늘었어요 🎉",
};

/** 🏠 홈 (모찌의 방) — 모찌 상태·스트릭이 실데이터로 반응. 숫자(체중/칼로리)는 없음(불변 #2). */
export function MochiRoom() {
  const { data: mochi } = useMochiState();
  const { data: streak } = useStreak();
  const state = mochi?.state ?? "idle";

  return (
    <main className="flex flex-col items-center gap-5">
      <MochiAvatar state={state} priority />
      <MochiSpeechBubble>{bubbleFor[state] ?? messages.mochi.greet}</MochiSpeechBubble>
      <TodaySuggestionCard />
      <StreakWidget days={streak?.count ?? 0} shields={streak?.shieldCount ?? 1} />
      <QuickActionBar />
    </main>
  );
}
