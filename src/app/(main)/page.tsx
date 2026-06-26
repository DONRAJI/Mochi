import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { messages } from "@/lib/messages";

/**
 * 🏠 홈 (모찌의 방) — 진입 첫 화면.
 * 불변 #2: 홈엔 숫자(체중/칼로리/달성률)를 두지 않는다. 진행도는 모찌 상태로만.
 */
export default function HomePage() {
  return (
    <main className="flex flex-col items-center gap-6">
      <MochiAvatar state="happy" />
      <MochiSpeechBubble>{messages.mochi.greet}</MochiSpeechBubble>

      <Card className="w-full">
        <p className="mb-1 text-sm text-cocoa-faint">오늘의 제안</p>
        <p className="text-lg font-medium">두부 곧 써볼까요? 김치두부조림 어때요 🍳</p>
      </Card>

      <div className="flex w-full gap-3">
        <Button className="flex-1">먹었어요</Button>
        <Button variant="soft" className="flex-1">
          재료 추가
        </Button>
      </div>
    </main>
  );
}
