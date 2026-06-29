"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { MEAL_MODES } from "../data";

/** 요리 ↔ 외식/배달 ↔ 간편식 모드 토글 (불변 #5, PRD 5.3·8장). */
export function ModeToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <SegmentedControl options={[...MEAL_MODES]} value={value} onChange={onChange} />;
}
