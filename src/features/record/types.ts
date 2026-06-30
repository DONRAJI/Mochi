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
