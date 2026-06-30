"use client";

import { Sheet } from "@/components/ui/Sheet";

const METHODS = [
  { emoji: "✏️", label: "직접 고르기", desc: "스티커로 톡톡" },
  { emoji: "📷", label: "냉장고 사진", desc: "모찌가 알아볼게요" },
  { emoji: "🧾", label: "영수증·바코드", desc: "찍으면 끝" },
] as const;

/** 입력 방식 선택 시트 — 수동/사진(AI)/영수증·바코드 (PRD 5.2). */
export function InputMethodSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="어떻게 담을까요?">
      <div className="flex flex-col gap-2">
        {METHODS.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={onClose}
            className="flex items-center gap-3 rounded-mochi-sm bg-cream-200 px-4 py-3 text-left transition-transform ease-jelly active:scale-[0.97]"
          >
            <span className="text-2xl">{m.emoji}</span>
            <div>
              <p className="font-medium text-cocoa">{m.label}</p>
              <p className="text-sm text-cocoa-faint">{m.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
