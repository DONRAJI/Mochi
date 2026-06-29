import { Card } from "@/components/ui/Card";

const suggestions = [
  { id: 1, emoji: "🍳", title: "김치두부조림", hint: "두부 곧 써볼까요?", tone: "bg-peach-soft" },
  { id: 2, emoji: "🥗", title: "닭가슴살 샐러드", hint: "가볍게 한 끼", tone: "bg-mint-soft" },
  { id: 3, emoji: "🍙", title: "참치마요 주먹밥", hint: "10분이면 충분", tone: "bg-lavender-soft" },
] as const;

/** 오늘의 제안 — 가로 스와이프로 대안 보기 (PRD 5.1). */
export function TodaySuggestionCard() {
  return (
    <section className="w-full">
      <p className="mb-2 text-sm text-cocoa-faint">오늘의 제안</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {suggestions.map((s) => (
          <Card key={s.id} className={`min-w-[78%] ${s.tone}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{s.emoji}</span>
              <div>
                <p className="text-lg font-medium text-cocoa">{s.title}</p>
                <p className="text-sm text-cocoa-soft">{s.hint}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
