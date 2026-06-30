"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";

const TAGS = ["전체", "선호", "비선호", "알러지"] as const;

/** 선호/비선호/알러지 필터 칩 (PRD 5.2). */
export function TagFilterChips() {
  const [active, setActive] = useState<string>("전체");
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {TAGS.map((t) => (
        <Chip key={t} active={active === t} onClick={() => setActive(t)}>
          {t}
        </Chip>
      ))}
    </div>
  );
}
