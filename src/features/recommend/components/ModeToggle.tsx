"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { MEAL_SEGMENTS } from "../data";

/** 요리 ↔ 밖에서 토글 (불변 #5 — 요리 안 하는 사용자도 같은 무게의 갈래, PRD 5.3·8장). */
export function ModeToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <SegmentedControl options={[...MEAL_SEGMENTS]} value={value} onChange={onChange} />;
}
