import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";
import { StreakWidget } from "@/features/mochi/components/StreakWidget";
import { TodaySuggestionCard } from "@/features/mochi/components/TodaySuggestionCard";
import { QuickActionBar } from "@/features/mochi/components/QuickActionBar";
import { messages } from "@/lib/messages";

/**
 * 🏠 홈 (모찌의 방) — 진입 첫 화면.
 * 불변 #2: 홈엔 체중/칼로리/달성률 숫자를 두지 않는다. 진행도는 모찌 상태로.
 */
export default function HomePage() {
  return (
    <main className="flex flex-col items-center gap-5">
      <MochiAvatar state="happy" />
      <MochiSpeechBubble>{messages.mochi.greet}</MochiSpeechBubble>
      <TodaySuggestionCard />
      <StreakWidget />
      <QuickActionBar />
    </main>
  );
}
