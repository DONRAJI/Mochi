import { z } from "zod";

export type MealMode = "cook" | "eatout" | "convenience";

/** GET /api/recommend/meals 쿼리 검증 (목록은 페이지네이션 — security.md §5). */
export const recommendQuerySchema = z.object({
  mode: z.enum(["cook", "eatout", "convenience"]),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(50).default(20),
});

/** 내 요리 등록 (PRD 11.3 — 냉장고 재료로 만드는 자기만의 요리). */
export const createRecipeSchema = z.object({
  name: z.string().min(1, "요리 이름을 알려줄래요?").max(40),
  ingredients: z
    .array(z.string().min(1).max(20))
    .min(1, "재료를 하나만 더 넣어볼까요?")
    .max(20),
  steps: z.array(z.string().min(1).max(200)).max(20).default([]),
  minutes: z.coerce.number().int().min(1).max(300).optional(),
});

export type CreateRecipeRequest = z.infer<typeof createRecipeSchema>;

export interface CreateRecipeResponse {
  id: string;
}

/** 레시피 재료 한 줄 + 다이어트 힌트(대체·선택). cook 모드에서만 채워진다. */
export interface RecipeIngredient {
  name: string; // 표준화된 재료명
  owned: boolean; // 냉장고에 있는지
  optional: boolean; // 없어도 되는 고명·선택 재료
  swap: { to: string; note: string } | null; // 가벼운 대체 제안
}

/** 3모드 통합 추천 카드 모델. cook만 matchRate/missing/steps/ingredients가 의미 있음. */
export interface RecommendationResponse {
  id: string;
  name: string;
  emoji: string | null;
  imageUrl: string | null; // 완성 요리 사진(cook). 없으면 emoji로 폴백
  badge: string | null;
  minutes: number | null; // cook
  servings: number | null; // cook
  matchRate: number | null; // cook (냉장고 기준)
  missingIngredients: string[]; // cook (추가구매)
  ingredients: RecipeIngredient[]; // cook (재료 + 대체/선택 힌트)
  mine: boolean; // cook — 내가 등록한 요리 (PRD 11.3)
  usesExpiring: boolean; // cook — 유통기한 임박 재료를 쓰는 레시피 (PRD 5.2)
  subtitle: string | null; // eatout=카테고리, convenience=브랜드
  rarity: string;
  steps: string[]; // cook 조리 단계
}
