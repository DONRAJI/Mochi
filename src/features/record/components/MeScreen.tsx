"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { WeightTrendChart } from "./WeightTrendChart";
import { MeMenuList } from "./MeMenuList";

/**
 * 👤 마이 — 기록·더보기. 숫자(체중·통계)는 '더보기' 안에서만 펼쳐 본다 (불변 #2).
 */
export function MeScreen() {
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-cocoa">마이</h1>

      <Card className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-mochi-lg bg-mint-soft text-2xl">
          •‿•
        </span>
        <div>
          <p className="font-bold text-cocoa">모찌 친구</p>
          <p className="text-sm text-cocoa-faint">오늘도 잘 먹고 있어요</p>
        </div>
      </Card>

      <button
        type="button"
        onClick={() => setShowStats((s) => !s)}
        className="flex items-center justify-between rounded-mochi bg-cream-50 px-4 py-3 shadow-mochi-press"
      >
        <span className="text-cocoa">체중·통계 더보기</span>
        <span className="text-sm text-cocoa-faint">{showStats ? "접기" : "펼치기"}</span>
      </button>
      {showStats && <WeightTrendChart />}

      <MeMenuList />
    </div>
  );
}
