import { Card } from "@/components/ui/Card";
import { messages } from "@/lib/messages";

/** 🧊 냉장고 — 재료. '입력 모드' 중 하나일 뿐 (불변 #5). 빈 상태는 외식 모드로 브릿지. */
export default function FridgePage() {
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">냉장고</h1>
      <Card>
        <p className="text-cocoa-soft">{messages.empty.fridge}</p>
      </Card>
    </main>
  );
}
