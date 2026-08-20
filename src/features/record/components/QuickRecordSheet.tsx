"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { useMarkMealEaten } from "../hooks/useRecord";
import { useMe } from "@/features/auth/hooks/useAuth";
import { SLOT_LABEL, SLOT_EMOJI, estimateSlot } from "../slot";
import type { MealSlot } from "../types";

const MODES = [
  { value: "cook", label: "🍳 요리" },
  { value: "eatout", label: "🍽️ 외식" },
  { value: "convenience", label: "🏪 간편식" },
] as const;

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

interface QuickRecordSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 직접 입력 기록 — 카탈로그에 없는 걸 그 자리에서 남긴다(예: "추러스", "외식 감자탕").
 *
 * 지금까지는 추천 카탈로그나 내 요리에서 **골라야만** 기록이 됐다. 밖에서 사 먹은 것,
 * 간식처럼 목록에 없는 건 남길 방법이 아예 없어 그날 기록이 비었다.
 * 이름만 있으면 되고, 나머지(끼니·모드)는 기본값이 잡혀 있어 한 줄 적고 바로 끝난다.
 */
export function QuickRecordSheet({ open, onClose }: QuickRecordSheetProps) {
  const router = useRouter();
  const mark = useMarkMealEaten();
  const { data: me } = useMe();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]["value"]>("eatout");
  // 지금 시간대로 끼니를 미리 골라둔다 — 대부분 그대로 두고 넘어간다.
  const [slot, setSlot] = useState<MealSlot>(() => estimateSlot(new Date()));
  const [kcal, setKcal] = useState("");

  const trimmed = title.trim();
  const canSubmit = trimmed.length > 0 && !mark.isPending;
  // 칼로리 입력은 숫자를 보기로 한 사람에게만 (불변 #2 — cozy는 숫자를 숨긴다).
  const showKcal = me?.displayMode === "detail";

  function reset() {
    setTitle("");
    setKcal("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const parsedKcal = showKcal && kcal.trim() ? Number(kcal) : undefined;
    mark.mutate(
      {
        mode,
        slot,
        title: trimmed,
        ...(Number.isFinite(parsedKcal) ? { kcal: parsedKcal } : {}),
        rarity: "common",
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="오늘 먹은 것 적기">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="meal-title" className="text-sm text-cocoa-soft">
            무엇을 드셨나요?
          </label>
          <Input
            id="meal-title"
            value={title}
            maxLength={40}
            placeholder="예: 추러스, 감자탕"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-cocoa-soft">어떻게 드셨어요?</span>
          <div className="flex gap-2">
            {MODES.map((m) => (
              <Chip key={m.value} active={mode === m.value} onClick={() => setMode(m.value)}>
                {m.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-cocoa-soft">언제 드셨어요?</span>
          <div className="flex gap-2">
            {SLOTS.map((s) => (
              <Chip key={s} active={slot === s} onClick={() => setSlot(s)}>
                {SLOT_EMOJI[s]} {SLOT_LABEL[s]}
              </Chip>
            ))}
          </div>
        </div>

        {showKcal && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="meal-kcal" className="text-sm text-cocoa-soft">
              칼로리 (알면 적어주세요)
            </label>
            <Input
              id="meal-kcal"
              type="number"
              inputMode="numeric"
              min={0}
              max={5000}
              value={kcal}
              placeholder="비워둬도 괜찮아요"
              onChange={(e) => setKcal(e.target.value)}
            />
          </div>
        )}

        <Button type="submit" className={canSubmit ? "w-full" : "w-full opacity-60"}>
          {mark.isPending ? "남기는 중…" : "기록하기 🌱"}
        </Button>
        {mark.isError && (
          <p className="text-center text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
        )}

        {/* 카탈로그에서 고르고 싶은 사람을 위한 출구 — 추천은 매칭률·재료 정보가 붙는다. */}
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push("/meals");
          }}
          className="text-center text-sm text-cocoa-faint underline"
        >
          추천 목록에서 고를래요
        </button>
      </form>
    </Sheet>
  );
}
