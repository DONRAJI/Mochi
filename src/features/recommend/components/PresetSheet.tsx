"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePresets, useSavePreset, useApplyPreset, useRemovePreset } from "../hooks/usePlan";
import { WEEKDAY_LABEL } from "../week";
import type { PresetResponse } from "../preset";

interface PresetSheetProps {
  open: boolean;
  onClose: () => void;
  /** 저장·적용 대상 주(월~일). 클라가 계산한 이번 주. */
  week: string[];
}

/**
 * 주간 식단 프리셋 (매주 비슷하게 먹는 사람용).
 * 저장은 **이번 주 계획에서** 뜬다 — 빈 화면에서 한 주치를 만들게 하면 아무도 안 쓴다.
 * 적용은 빈 자리만 채우고, 몇 개 담았는지 그대로 알려준다.
 */
export function PresetSheet({ open, onClose, week }: PresetSheetProps) {
  const { data: presets, isPending } = usePresets();
  const save = useSavePreset();
  const apply = useApplyPreset();
  const remove = useRemovePreset();
  const [name, setName] = useState("");

  function onSave() {
    const trimmed = name.trim();
    if (!trimmed || save.isPending) return;
    save.mutate({ name: trimmed, dates: week }, { onSuccess: () => setName("") });
  }

  return (
    <Sheet open={open} onClose={onClose} title="주간 프리셋">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-cocoa-soft">
          매주 비슷하게 드시나요? 이번 주 식단을 저장해두면 다음 주에 그대로 담을 수 있어요.
        </p>

        {/* 저장 — 이미 짜둔 이번 주를 이름만 붙여 보관 */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-cocoa-faint">이번 주를 프리셋으로</p>
          <div className="flex gap-2">
            <Input
              value={name}
              maxLength={20}
              placeholder="예: 평일 루틴"
              onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={onSave} className={name.trim() ? undefined : "opacity-60"}>
              {save.isPending ? "저장 중…" : "저장"}
            </Button>
          </div>
          {save.isError && (
            <p className="text-sm text-cocoa-soft">{(save.error as Error).message}</p>
          )}
        </div>

        {/* 목록 — 적용/삭제 */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-cocoa-faint">저장한 프리셋</p>
          {isPending && <p className="text-sm text-cocoa-faint">불러오는 중…</p>}
          {!isPending && (presets?.length ?? 0) === 0 && (
            <p className="text-sm text-cocoa-faint">
              아직 없어요. 이번 주 식단을 채우고 위에서 저장해보세요 🌿
            </p>
          )}
          {presets?.map((p) => (
            <PresetRow
              key={p.id}
              preset={p}
              applying={apply.isPending}
              onApply={() => apply.mutate({ id: p.id, dates: week })}
              onRemove={() => remove.mutate(p.id)}
            />
          ))}
          {apply.isSuccess && !apply.isPending && (
            <p className="text-sm text-cocoa-soft">
              {apply.data.added > 0
                ? `${apply.data.added}끼 담았어요 🌿`
                : "이미 채워져 있어서 그대로 뒀어요."}
              {apply.data.skipped > 0 && ` (이미 있던 ${apply.data.skipped}칸은 그대로)`}
            </p>
          )}
        </div>
      </div>
    </Sheet>
  );
}

/** 프리셋 한 줄 — 이름·구성 요약과 적용/삭제. */
function PresetRow({
  preset,
  applying,
  onApply,
  onRemove,
}: {
  preset: PresetResponse;
  applying: boolean;
  onApply: () => void;
  onRemove: () => void;
}) {
  // 어느 요일에 들었는지 한 줄 요약 — 이름만으론 뭘 저장했는지 잊는다.
  const days = [...new Set(preset.items.map((i) => i.weekday))]
    .sort((a, b) => a - b)
    .map((w) => WEEKDAY_LABEL[w])
    .join("·");

  return (
    <div className="flex items-center gap-2 rounded-mochi bg-cream-50 px-3 py-2.5 shadow-mochi-press">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-cocoa">{preset.name}</p>
        <p className="truncate text-xs text-cocoa-faint">
          {preset.itemCount}끼 · {days}
        </p>
      </div>
      <button
        type="button"
        onClick={onApply}
        disabled={applying}
        className="shrink-0 rounded-mochi-sm bg-mint px-3 py-1.5 text-xs text-cocoa transition-transform ease-jelly active:scale-90"
      >
        {applying ? "담는 중…" : "이번 주에 담기"}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="프리셋 삭제"
        className="shrink-0 px-1 text-cocoa-faint transition-transform ease-jelly active:scale-90"
      >
        ✕
      </button>
    </div>
  );
}
