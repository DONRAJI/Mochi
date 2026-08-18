"use client";

import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";
import { RetryNotice } from "@/components/ui/RetryNotice";
import { TodaySuggestionCard } from "./TodaySuggestionCard";
import { StartHereCard } from "./StartHereCard";
import { StreakWidget } from "./StreakWidget";
import { QuickActionBar } from "./QuickActionBar";
import { WeeklyPlanCalendar } from "@/features/recommend/components/WeeklyPlanCalendar";
import { PhotoRecordButton } from "@/features/record/components/PhotoRecordButton";
import { useMochiState } from "../hooks/useMochi";
import { useStreak, useBalanceNudge } from "@/features/record/hooks/useRecord";
import { isOnboardingComplete } from "../onboarding";
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
  const mochiQuery = useMochiState();
  const streakQuery = useStreak();
  const { data: nudge } = useBalanceNudge();

  const mochi = mochiQuery.data;
  const streak = streakQuery.data;
  const state = mochi?.state ?? "idle";
  const stage = mochi?.growthStage ?? 1;

  // 모찌 자신은 기다리지 않고 바로 띄운다 — 앱이 즉시 살아 있게. 표정이 idle→happy로 바뀌는 건
  // 부드러운 전환이지만, 아래 '성장 단계·연속 기록'은 숫자라서 오면 튄다 → 올 때까지 자리만 지킨다.
  const growthPending = mochiQuery.isPending;
  const streakPending = streakQuery.isPending;
  // 세션 만료(401)는 전역에서 로그인으로 돌려보내므로, 여기 남는 건 네트워크·서버가 잠깐 쉬는 경우.
  const stalled = mochiQuery.isError || streakQuery.isError;

  // 아직 첫 모찌를 못 뽑은 사용자에겐 아래 안내 카드를 가리키는 인사로 — 첫 화면에서
  // 뭘 해야 할지 모르던 문제(핵심 루프가 안 보임)를 말풍선부터 이어준다.
  const isNewcomer = !mochiQuery.isPending && !!mochi && !isOnboardingComplete(mochi.collectedCount);

  // 며칠 든든했으면 모찌가 오늘 가벼운 쪽을 제안(경고 아님, PRD 11.5). 그 외엔 상태 인사.
  const bubble =
    nudge?.kind === "light"
      ? nudge.message
      : isNewcomer
        ? messages.mochi.welcome
        : (bubbleFor[state] ?? messages.mochi.greet);

  return (
    <main className="flex flex-col items-center gap-5">
      <MochiAvatar state={state} priority />
      <MochiSpeechBubble>{bubble}</MochiSpeechBubble>

      {stalled && (
        <RetryNotice
          onRetry={() => {
            mochiQuery.refetch();
            streakQuery.refetch();
          }}
        />
      )}

      {/* 성장 단계 — 수집할수록 모찌가 자란다 (PRD: 진행도=성장) */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-cocoa-faint">함께 자라는 중</span>
        {Array.from({ length: MAX_STAGE }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              // 아직 모르는 단계를 채워 그리지 않는다 — 1칸만 켰다가 4칸으로 튀는 걸 방지.
              !growthPending && i < stage ? "bg-mint-deep" : "bg-cream-200",
            )}
          />
        ))}
      </div>
      {/* 첫 안내 — 핵심 루프(재료→기록→뽑기). 첫 모찌를 뽑으면 스스로 사라진다. */}
      <StartHereCard />

      <TodaySuggestionCard />
      {/* 이번 주 식단 — 홈에서 바로 보이게(식단탭에 숨지 않도록). 계획·먹었어요를 여기서. */}
      <div className="w-full">
        <WeeklyPlanCalendar />
      </div>
      <StreakWidget
        days={streak?.count ?? 0}
        shields={streak?.shieldCount ?? 1}
        loading={streakPending}
      />
      <QuickActionBar />
      {/* 사진 한 장으로 기록 (PRD 8-3) — 요리 안 해도 먹기→찍기→기록→모찌 칭찬 */}
      <PhotoRecordButton />
    </main>
  );
}
