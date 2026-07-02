"use client";

import { Chip } from "@/components/ui/Chip";
import { SORT_FILTERS } from "../data";

/** "15분 이내" "추가구매 없음" 등 정렬/필터 칩 (PRD 5.3). 다시 누르면 해제. */
export function SortFilterChips({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {SORT_FILTERS.map((f) => (
        <Chip key={f} active={value === f} onClick={() => onChange(value === f ? null : f)}>
          {f}
        </Chip>
      ))}
    </div>
  );
}
