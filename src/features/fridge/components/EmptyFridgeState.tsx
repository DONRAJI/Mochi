import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { messages } from "@/lib/messages";

/**
 * 빈 냉장고 — 비요리 사용자를 식단 탭 '밖에서 먹기'로 잇는 브릿지 (불변 #5, PRD 5.2·8장).
 * 장소 선택 화면으로 바로 들어가게 딥링크한다(추천 기본 갈래는 요리라서).
 */
export function EmptyFridgeState() {
  return (
    <Card className="flex flex-col items-center gap-3 bg-mint-soft py-8 text-center">
      <span className="text-5xl">🧊</span>
      <p className="text-cocoa-soft">{messages.empty.fridge}</p>
      <Link
        href="/meals?segment=outside"
        className="rounded-mochi-sm bg-mint px-4 py-2 text-sm text-cocoa shadow-mochi-press"
      >
        밖에서 먹기 보기
      </Link>
    </Card>
  );
}
