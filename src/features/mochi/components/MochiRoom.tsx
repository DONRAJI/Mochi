"use client";

import { useEffect } from "react";
import { useMochiStore } from "@/store/mochi";
import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";
import { RetryNotice } from "@/components/ui/RetryNotice";
import { TodaySuggestionCard } from "./TodaySuggestionCard";
import { GrowthCard } from "./GrowthCard";
import { StartHereCard } from "./StartHereCard";
import { StreakWidget } from "./StreakWidget";
import { QuickActionBar } from "./QuickActionBar";
import { WeeklyPlanCalendar } from "@/features/recommend/components/WeeklyPlanCalendar";
import { PhotoRecordButton } from "@/features/record/components/PhotoRecordButton";
import { useMochiState } from "../hooks/useMochi";
import { useStreak, useBalanceNudge } from "@/features/record/hooks/useRecord";
import { isOnboardingComplete } from "../onboarding";
import { messages } from "@/lib/messages";

const bubbleFor: Record<string, string> = {
  happy: "오늘도 잘 먹었네요, 뿌듯해요 😊",
  sleepy: "쉬어가도 괜찮아요 😴",
  idle: messages.mochi.greet,
  cheer: "잘 먹었네요! 씨앗이 쑥 자랐어요 🌱",
};

/** 환호 유지 시간 — 기록 직후 홈에 오면 이만큼 cheer 표정으로 반겨준다. */
const CHEER_MS = 4000;

/** 🏠 홈 (모찌의 방) — 모찌 상태·스트릭이 실데이터로 반응. 숫자(체중/칼로리)는 없음(불변 #2). */
export function MochiRoom() {
  const mochiQuery = useMochiState();
  const streakQuery = useStreak();
  const { data: nudge } = useBalanceNudge();

  const mochi = mochiQuery.data;
  const streak = streakQuery.data;

  // 환호 오버레이 — '먹었어요'/뽑기 직후 몇 초간 cheer 표정을 덧그린 뒤 서버 상태로 복귀.
  // 서버는 cheer를 반환하지 않는다(순간 반응은 저장할 상태가 아님 — store/mochi.ts).
  const cheerAt = useMochiStore((s) => s.cheerAt);
  const settle = useMochiStore((s) => s.settle);
  useEffect(() => {
    if (cheerAt === null) return;
    // 다른 탭에서 환호하고 한참 뒤에 홈에 온 경우 — 남은 시간만 유지(0 이하면 즉시 복귀).
    const remaining = CHEER_MS - (Date.now() - cheerAt);
    if (remaining <= 0) {
      settle();
      return;
    }
    const t = setTimeout(settle, remaining);
    return () => clearTimeout(t);
  }, [cheerAt, settle]);

  const cheering = cheerAt !== null;
  const state = cheering ? "cheer" : (mochi?.state ?? "idle");

  // 모찌 자신은 기다리지 않고 바로 띄운다 — 앱이 즉시 살아 있게. 표정이 idle→happy로 바뀌는 건
  // 부드러운 전환이지만, '연속 기록' 같은 숫자는 오면 튄다 → 올 때까지 자리만 지킨다.
  // (성장은 GrowthCard가 자체적으로 로딩을 처리한다.)
  const streakPending = streakQuery.isPending;
  // 세션 만료(401)는 전역에서 로그인으로 돌려보내므로, 여기 남는 건 네트워크·서버가 잠깐 쉬는 경우.
  const stalled = mochiQuery.isError || streakQuery.isError;

  // 아직 첫 모찌를 못 뽑은 사용자에겐 아래 안내 카드를 가리키는 인사로 — 첫 화면에서
  // 뭘 해야 할지 모르던 문제(핵심 루프가 안 보임)를 말풍선부터 이어준다.
  const isNewcomer = !mochiQuery.isPending && !!mochi && !isOnboardingComplete(mochi.collectedCount);

  // 말풍선 우선순위: 방금 잘 먹은 환호가 최우선(신규 안내보다 축하가 먼저), 다음 밸런싱
  // 넛지(가벼운 제안, 경고 아님 — PRD 11.5), 신규 인사, 그 외 상태 인사.
  const bubble = cheering
    ? bubbleFor.cheer
    : nudge?.kind === "light"
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

      {/* 성장 단계 — 잘 먹은 날이 쌓일수록 자란다 (PRD: 진행도=성장, growth.ts) */}
      <GrowthCard />
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
