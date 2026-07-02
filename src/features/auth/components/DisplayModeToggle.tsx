"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useMe, useSetDisplayMode } from "../hooks/useAuth";
import type { DisplayMode } from "../types";

const MODES: { value: DisplayMode; label: string; hint: string }[] = [
  { value: "cozy", label: "모찌랑 편하게", hint: "숫자 없이 편하게" },
  { value: "detail", label: "숫자도 볼래요", hint: "식단·기록에 칼로리 표시" },
];

/**
 * 표시 모드 전환 (#4). cozy=숫자 숨김(기본), detail=관리 모드.
 * 홈(모찌의 방)은 어느 모드든 숫자가 없다 — 노출은 식단·기록·마이에만.
 */
export function DisplayModeToggle() {
  const { data: me } = useMe();
  const setMode = useSetDisplayMode();
  const current: DisplayMode = me?.displayMode ?? "cozy";

  return (
    <Card className="flex flex-col gap-2">
      <p className="font-display text-cocoa">표시 모드</p>
      <div className="flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => current !== m.value && setMode.mutate(m.value)}
            className={cn(
              "flex-1 rounded-mochi px-3 py-2 text-left shadow-mochi-press transition-transform ease-jelly active:scale-[0.97]",
              current === m.value ? "bg-mint text-cocoa" : "bg-cream-200 text-cocoa-faint",
            )}
          >
            <span className="block text-sm font-medium">{m.label}</span>
            <span className="block text-xs text-cocoa-faint">{m.hint}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
