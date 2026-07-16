"use client";

import { useRouter } from "next/navigation";
import { WeightSection } from "./WeightSection";
import { WeightHistorySection } from "./WeightHistorySection";

/**
 * ⚖️ 체중 기록 전용 화면 (마이 > 체중, /me/weight) — 설정과 분리된 first-class 관리 공간.
 * 체중 입력 → 최근 흐름 → (기록이 쌓이면) 주간·월별·연간 정리. 숫자는 여기(마이 트리)에만(불변 #2).
 * 죄책감 제로(불변 #1): 목표 압박·빨강 없이 부드러운 흐름으로만 보여준다.
 */
export function WeightScreen() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/me")}
          aria-label="마이로 돌아가기"
          className="rounded-mochi-sm px-2 py-1 text-cocoa-faint transition-transform ease-jelly active:scale-90"
        >
          ‹
        </button>
        <h1 className="text-title text-cocoa">체중 기록</h1>
      </div>

      <p className="px-1 text-sm text-cocoa-soft">
        오늘의 체중을 살짝 남겨두면, 모찌가 부드러운 흐름으로 정리해줄게요 🌿
      </p>

      <WeightSection />
      <WeightHistorySection />
    </div>
  );
}
