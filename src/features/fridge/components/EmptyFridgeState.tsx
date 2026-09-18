import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { messages } from "@/lib/messages";

/**
 * 빈 냉장고 — 사 먹는 사람을 '기록'으로 잇는 브릿지 (불변 #5, PRD 5.2·8장).
 * 밖에서 먹는 건 제안이 아니라 기록이라(2026-09-18) 홈의 '먹었어요'로 보낸다 — 거기서 장소로 고른다.
 */
export function EmptyFridgeState() {
  return (
    <Card className="flex flex-col items-center gap-3 bg-mint-soft py-8 text-center">
      <span className="text-5xl">🧊</span>
      <p className="text-cocoa-soft">{messages.empty.fridge}</p>
      <Link
        href="/"
        className="rounded-mochi-sm bg-mint px-4 py-2 text-sm text-cocoa shadow-mochi-press"
      >
        밖에서 먹은 것 기록하기
      </Link>
    </Card>
  );
}
