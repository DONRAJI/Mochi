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

/** 계획 이동(드래그 재배치) — 다른 날짜(그리고 선택적으로 다른 끼니)로 옮긴다. */
export const movePlanSchema = z.object({
  date: dateStr,
  slot: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
});

export type MovePlanRequest = z.infer<typeof movePlanSchema>;

/** 주간 범위 조회 (from~to, YYYY-MM-DD 포함). */
export const planRangeSchema = z.object({ from: dateStr, to: dateStr });

/** 이번 주 빈 날 자동 채우기 (PRD 4.3) — 클라가 이번 주 날짜들을 넘긴다. */
export const autoFillSchema = z.object({ dates: z.array(dateStr).min(1).max(7) });
export type AutoFillRequest = z.infer<typeof autoFillSchema>;

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
