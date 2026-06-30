"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { WeightSection } from "./WeightSection";
import { MeMenuList } from "./MeMenuList";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useStreak } from "../hooks/useRecord";
import { useMochiState } from "@/features/mochi/hooks/useMochi";

/**
 * 👤 마이 — 기록·더보기. 숫자(체중·통계)는 '더보기' 안에서만 펼쳐 본다 (불변 #2).
 */
export function MeScreen() {
  const [showStats, setShowStats] = useState(false);
  const { data: me } = useMe();
  const { data: streak } = useStreak();
  const { data: mochi } = useMochiState();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title text-cocoa">마이</h1>

      <Card className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-mochi-lg bg-mint-soft text-2xl">
          •‿•
        </span>
        <div>
          <p className="font-display text-cocoa">{me?.nickname ?? "모찌 친구"}</p>
          <p className="text-sm text-cocoa-faint">
            스트릭 {streak?.count ?? 0}일째 · 모은 카드 {mochi?.collectedCount ?? 0}개
          </p>
        </div>
      </Card>

      <button
        type="button"
        onClick={() => setShowStats((s) => !s)}
        className="flex items-center justify-between rounded-mochi bg-cream-50 px-4 py-3 shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
      >
        <span className="text-cocoa">체중·통계 더보기</span>
        <span className="text-sm text-cocoa-faint">{showStats ? "접기" : "펼치기"}</span>
      </button>
      {showStats && <WeightSection />}

      <MeMenuList />
    </div>
  );
}
