"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Gauge } from "@/components/ui/Gauge";
import { useMochiState } from "../hooks/useMochi";
import { useStreak } from "@/features/record/hooks/useRecord";
import { useIngredients } from "@/features/fridge/hooks/useFridge";
import {
  buildOnboardingSteps,
  isOnboardingComplete,
  onboardingHeadline,
  type OnboardingStep,
} from "../onboarding";
import { cn } from "@/lib/utils";

/**
 * 첫 안내 — 가입 직후 홈에서 핵심 루프(재료 → 기록 → 뽑기)를 한눈에.
 * 첫 모찌를 뽑으면 사라지고 다시 나오지 않는다(onboarding.ts).
 *
 * 스킵 버튼을 두지 않은 이유: 세 단계 자체가 앱의 핵심 동선이라 '건너뛸 것'이 아니고,
 * 첫 뽑기와 동시에 자동으로 사라지기 때문. localStorage 기반 숨김은 하이드레이션
 * 주의사항(conventions.md)만 늘고 얻는 게 없다.
 */
export function StartHereCard() {
  const router = useRouter();
  const { data: mochi, isPending: mochiPending } = useMochiState();
  const { data: streak, isPending: streakPending } = useStreak();
  const { data: ingredients, isPending: fridgePending } = useIngredients();

  // 값이 오기 전엔 아무것도 그리지 않는다 — 이미 루프를 돈 사용자에게 안내가 번쩍이지 않게.
  if (mochiPending || streakPending || fridgePending) return null;
  if (!mochi || isOnboardingComplete(mochi.collectedCount)) return null;

  const steps = buildOnboardingSteps({
    hasIngredients: (ingredients?.length ?? 0) > 0,
    hasRecord: (streak?.count ?? 0) > 0,
    seeds: mochi.seeds,
    drawCost: mochi.drawCost,
    collectedCount: mochi.collectedCount,
  });

  return (
    <Card className="w-full bg-butter-soft">
      <p className="font-display text-lg text-cocoa">{onboardingHeadline(steps)}</p>
      <p className="mt-0.5 text-sm text-cocoa-soft">
        잘 먹은 날마다 씨앗이 쌓이고, 씨앗으로 모찌를 뽑아요.
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {steps.map((s) => (
          <StepRow key={s.key} step={s} onClick={() => router.push(s.href)} />
        ))}
      </div>

      {/* 씨앗 진척 — 게임 재화라 불변 #2(체중·칼로리)와 무관. 홈의 스트릭 일수와 같은 층위. */}
      <div className="mt-3">
        <Gauge value={Math.min(mochi.seeds, mochi.drawCost)} max={mochi.drawCost} tone="mint" />
        <p className="mt-1 text-center text-xs text-cocoa-faint">
          🌱 씨앗 {mochi.seeds} / {mochi.drawCost}
        </p>
      </div>
    </Card>
  );
}

/** 단계 한 줄 — 탭하면 그 화면으로. 완료는 체크로만 표시하고 흐리게 지적하지 않는다(불변 #1). */
function StepRow({ step, onClick }: { step: OnboardingStep; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-mochi-sm bg-cream-50 px-3 py-2 text-left",
        "shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm",
          step.done ? "bg-mint text-cocoa" : "bg-cream-200",
        )}
      >
        {step.done ? "✓" : step.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-cocoa">{step.label}</span>
        <span className="block truncate text-xs text-cocoa-faint">{step.hint}</span>
      </span>
      <span className="shrink-0 text-cocoa-faint">›</span>
    </button>
  );
}
