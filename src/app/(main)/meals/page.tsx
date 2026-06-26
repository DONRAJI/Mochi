import { Card } from "@/components/ui/Card";
import { messages } from "@/lib/messages";

/** 🍽️ 식단 — 추천 엔진의 얼굴. 요리/외식/간편식 모드를 같은 탭이 흡수 (불변 #5, PRD 8장). */
export default function MealsPage() {
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">오늘 뭐 먹지</h1>
      <Card>
        <p className="text-cocoa-soft">{messages.empty.meals}</p>
      </Card>
    </main>
  );
}
