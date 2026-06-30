import { z } from "zod";

/** '먹었어요' 입력 (Route Handler 경계 검증). refId = 먹은 항목(cook=recipe, convenience=item). */
export const markMealSchema = z.object({
  mode: z.enum(["cook", "eatout", "convenience"]),
  refId: z.string().min(1).max(60).optional(),
  rarity: z.enum(["common", "rare", "epic", "seasonal"]).default("common"),
  memo: z.string().max(200).optional(),
});

export type MarkMealRequest = z.infer<typeof markMealSchema>;

export interface MealRecordResponse {
  recordId: string;
  mochiState: string; // 'cheer'
  streakCount: number;
  cardAcquired: boolean; // 새 도감 카드 획득 여부
}

export interface StreakResponse {
  count: number;
  shieldCount: number;
}

/** 체중 기록 — 숫자는 마이>더보기에서만 (불변 #2). */
export const createWeightSchema = z.object({
  weight: z.coerce.number().min(20, "체중을 한 번만 더 봐줄래요?").max(300),
  loggedAt: z.coerce.date().optional(),
});

export const weightQuerySchema = z.object({
  size: z.coerce.number().int().min(1).max(120).default(30),
});

export interface WeightLogResponse {
  id: string;
  weight: number;
  loggedAt: string; // ISO
}
