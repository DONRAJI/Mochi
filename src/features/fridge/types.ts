import { z } from "zod";

/** 재료 추가 입력 (Route Handler 경계 검증 — security.md §3). */
export const createIngredientSchema = z.object({
  name: z.string().min(1, "재료 이름을 알려줄래요?").max(20),
  category: z.string().min(1).max(20),
});

/** 목록 조회 쿼리 (페이지네이션 — security.md §5). */
export const ingredientQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(50),
  category: z.string().max(20).optional(),
});

export type CreateIngredientRequest = z.infer<typeof createIngredientSchema>;

export interface IngredientResponse {
  id: string;
  name: string;
  category: string;
  rarity: string;
  expiresAt: string | null; // ISO 문자열
}
