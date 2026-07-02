"use client";

import { Chip } from "@/components/ui/Chip";
import type { RecommendationResponse } from "../types";

/**
 * 카테고리 내비 (#5) — 외식·간편식이 각 36개라 subtitle(외식=카테고리·간편식=브랜드)로 좁혀본다.
 * 항목의 subtitle에서 칩을 만들어 클라에서 필터. 종류가 1개 이하면 숨김.
 */
export function CategoryFilterChips({
  items,
  value,
  onChange,
}: {
  items: RecommendationResponse[];
  value: string;
  onChange: (v: string) => void;
}) {
  const categories = Array.from(
    new Set(items.map((i) => i.subtitle).filter((s): s is string => !!s)),
  );
  if (categories.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Chip active={value === "전체"} onClick={() => onChange("전체")}>
        전체
      </Chip>
      {categories.map((c) => (
        <Chip key={c} active={value === c} onClick={() => onChange(c)}>
          {c}
        </Chip>
      ))}
    </div>
  );
}
