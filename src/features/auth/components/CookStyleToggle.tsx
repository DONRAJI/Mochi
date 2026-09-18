"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useMe, useSetCooksOften } from "../hooks/useAuth";

const STYLES = [
  { value: true, label: "요리도 자주 해요", hint: "냉장고 재료로 만들 요리를 먼저" },
  { value: false, label: "주로 사 먹어요", hint: "밖에서 먹을 때 가벼운 메뉴를 먼저" },
];

/**
 * 요리 성향 (가입 때 고른 값) — 첫 화면이 이 값에 따라 달라진다:
 * 식단 탭의 첫 갈래(요리/밖에서), 홈 빠른 버튼(재료 추가/밖에서 먹기), 첫 안내의 냉장고 단계.
 *
 * 왜 여기 두는가(2026-09-18): 가입 때 한 번 고르면 바꿀 방법이 없었다. 사 먹다가 요리를 시작하는
 * 일이 흔한데 첫 화면이 계속 옛 선택에 묶여 있었다. 표시 모드 토글과 같은 자리·같은 모양.
 */
export function CookStyleToggle() {
  const { data: me } = useMe();
  const setCooks = useSetCooksOften();
  // 불러오기 전엔 아무것도 선택되지 않은 상태로 — 내가 고른 게 아닌 값이 먼저 보이지 않게(DisplayModeToggle과 같은 원칙).
  const current = me ? me.cooksOften : null;

  return (
    <Card className="flex flex-col gap-2">
      <p className="font-display text-cocoa">요리 성향</p>
      <div className="flex gap-2">
        {STYLES.map((s) => (
          <button
            key={String(s.value)}
            type="button"
            onClick={() => current !== s.value && setCooks.mutate(s.value)}
            className={cn(
              "flex-1 rounded-mochi px-3 py-2 text-left shadow-mochi-press transition-transform ease-jelly active:scale-[0.97]",
              current === s.value ? "bg-mint text-cocoa" : "bg-cream-200 text-cocoa-faint",
            )}
          >
            <span className="block text-sm font-medium">{s.label}</span>
            <span className="block text-xs text-cocoa-faint">{s.hint}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-cocoa-faint">
        고른 쪽이 식단 탭과 홈에서 먼저 보여요 · 언제든 바꿀 수 있어요
      </p>
    </Card>
  );
}
