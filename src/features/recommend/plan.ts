import { z } from "zod";
import type { MealSlot } from "@/features/record/types";
import type { MealMode } from "./types";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜를 한 번만 더 봐줄래요?");

/** 주간 식단에 한 끼 담기 (PRD 5.3 — 추천/상세에서 "이 날에 담기"). */
export const addPlanSchema = z.object({
  date: dateStr,
  slot: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  mode: z.enum(["cook", "eatout", "convenience"]),
  refId: z.string().max(60).optional(),
  title: z.string().min(1).max(60),
  emoji: z.string().max(8).optional(),
});

export type AddPlanRequest = z.infer<typeof addPlanSchema>;

/** 주간 범위 조회 (from~to, YYYY-MM-DD 포함). */
export const planRangeSchema = z.object({ from: dateStr, to: dateStr });

export interface PlannedMealResponse {
  id: string;
  date: string; // YYYY-MM-DD
  slot: MealSlot | null;
  mode: MealMode;
  refId: string | null;
  title: string;
  emoji: string | null;
  eaten: boolean;
}
