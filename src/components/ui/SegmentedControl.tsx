"use client";

import { cn } from "@/lib/utils";

interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** 세그먼트 토글 — 식단 모드(요리/외식/간편식)·도감 탭 등에 공용. */
export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn("flex rounded-mochi-sm bg-cream-200 p-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-mochi-sm px-3 py-2 text-sm",
            value === opt.value ? "bg-cream-50 text-cocoa shadow-mochi-press" : "text-cocoa-faint",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
