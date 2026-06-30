const WEEK = [
  { d: "월", emoji: "🍳" },
  { d: "화", emoji: "🥗" },
  { d: "수", emoji: "🍲" },
  { d: "목", emoji: "🍙" },
  { d: "금", emoji: "🍜" },
  { d: "토", emoji: "🍱" },
  { d: "일", emoji: "🍳" },
] as const;

/** 주간 식단 — 드래그 재배치는 추후, 지금은 정적 스트립 (PRD 5.3). */
export function WeeklyPlanStrip() {
  return (
    <section>
      <p className="mb-2 text-sm text-cocoa-faint">이번 주 식단</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {WEEK.map((x) => (
          <div
            key={x.d}
            className="flex min-w-fit flex-col items-center gap-1 rounded-mochi-sm bg-cream-50 px-3 py-2 shadow-mochi-press"
          >
            <span className="text-xs text-cocoa-faint">{x.d}</span>
            <span className="text-2xl">{x.emoji}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
