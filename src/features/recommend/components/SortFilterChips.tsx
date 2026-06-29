"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { SORT_FILTERS } from "../data";

/** "15분 이내" "추가구매 없음" 등 정렬/필터 칩 (PRD 5.3). */
export function SortFilterChips() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {SORT_FILTERS.map((f) => (
        <Chip key={f} active={active === f} onClick={() => setActive(active === f ? null : f)}>
          {f}
        </Chip>
      ))}
    </div>
  );
}
