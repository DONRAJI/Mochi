import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { messages } from "@/lib/messages";

/** 빈 냉장고 — 비요리 사용자를 외식 모드로 잇는 브릿지 (불변 #5, PRD 5.2·8장). */
export function EmptyFridgeState() {
  return (
    <Card className="flex flex-col items-center gap-3 bg-mint-soft py-8 text-center">
      <span className="text-5xl">🧊</span>
      <p className="text-cocoa-soft">{messages.empty.fridge}</p>
      <Link
        href="/meals"
        className="rounded-mochi-sm bg-mint px-4 py-2 text-sm text-cocoa shadow-mochi-press"
      >
        외식 모드 보기
      </Link>
    </Card>
  );
}
