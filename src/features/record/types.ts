import { z } from "zod";

/** 끼니 슬롯 (PRD 11.2). 시간대로 자동추정하되 사용자가 바꿀 수 있음. */
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

/** '먹었어요' 입력 (Route Handler 경계 검증). refId = 먹은 항목(cook=recipe, convenience=item). */
export const markMealSchema = z.object({
  mode: z.enum(["cook", "eatout", "convenience"]),
  slot: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(), // 없으면 서버가 시간대로 추정
  refId: z.string().min(1).max(60).optional(),
  rarity: z.enum(["common", "rare", "epic", "seasonal"]).default("common"),
  memo: z.string().max(200).optional(),
});

export type MarkMealRequest = z.infer<typeof markMealSchema>;

export interface MealRecordResponse {
  recordId: string;
  mochiState: string; // 'cheer'
  slot: MealSlot; // 기록된 끼니 슬롯
  streakCount: number;
  cardAcquired: boolean; // 새 도감 카드 획득 여부
}

/** 오늘의 끼니 한 줄 (마이 '오늘의 기록' 스트립). */
export interface TodayMealResponse {
  id: string;
  slot: MealSlot;
  mode: "cook" | "eatout" | "convenience";
  eatenAt: string; // ISO
  kcal: number | null; // detail(관리) 모드에서만 채워짐 (#4)
}

export interface StreakResponse {
  count: number;
  shieldCount: number;
}

/** 오늘의 kcal 예산 (#4 detail 모드). null이면 미표시(cozy거나 프로필 미완비). */
export interface DailyBudgetResponse {
  budget: number | null;
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

/** opt-in 개인 프로필 (PRD 11.4) — 원하는 사람만. 맞춤 가이드용, 저마찰 유지. */
export type Gender = "female" | "male" | "other";
export type ActivityLevel = "low" | "medium" | "high";

export const profileSchema = z.object({
  birthYear: z.coerce
    .number()
    .int()
    .min(1900, "태어난 해를 한 번만 더 봐줄래요?")
    .max(2026, "태어난 해를 한 번만 더 봐줄래요?")
    .nullable()
    .optional(),
  gender: z.enum(["female", "male", "other"]).nullable().optional(),
  heightCm: z.coerce
    .number()
    .int()
    .min(100, "키를 한 번만 더 봐줄래요?")
    .max(250, "키를 한 번만 더 봐줄래요?")
    .nullable()
    .optional(),
  activityLevel: z.enum(["low", "medium", "high"]).nullable().optional(),
});

export type ProfileRequest = z.infer<typeof profileSchema>;

export interface ProfileResponse {
  birthYear: number | null;
  gender: Gender | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  personalized: boolean; // 네 항목이 모두 채워졌는지 (맞춤 가이드 활성)
}
