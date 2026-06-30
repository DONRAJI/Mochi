import { z } from "zod";

export type MealMode = "cook" | "eatout" | "convenience";

/** GET /api/recommend/meals 쿼리 검증 (목록은 페이지네이션 — security.md §5). */
export const recommendQuerySchema = z.object({
  mode: z.enum(["cook", "eatout", "convenience"]),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(50).default(20),
});

/** 3모드 통합 추천 카드 모델. cook만 matchRate/missing/steps가 의미 있음. */
export interface RecommendationResponse {
  id: string;
  name: string;
  emoji: string | null;
  badge: string | null;
  minutes: number | null; // cook
  servings: number | null; // cook
  matchRate: number | null; // cook (냉장고 기준)
  missingIngredients: string[]; // cook (추가구매)
  subtitle: string | null; // eatout=카테고리, convenience=브랜드
  rarity: string;
  steps: string[]; // cook 조리 단계
}
