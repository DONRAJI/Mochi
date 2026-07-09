import { Suspense } from "react";
import { MealsScreen } from "@/features/recommend/components/MealsScreen";

/** 🍽️ 식단 — 추천 엔진의 얼굴 (PRD 5.3). Suspense는 useSearchParams(?open= 딥링크) 프리렌더 요건. */
export default function MealsPage() {
  return (
    <Suspense>
      <MealsScreen />
    </Suspense>
  );
}
