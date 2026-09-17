import { z } from "zod";
import { STORAGES, type Storage } from "./shelfLife";

/** 재료 추가 입력 (Route Handler 경계 검증 — security.md §3). */
export const createIngredientSchema = z.object({
  name: z.string().min(1, "재료 이름을 알려줄래요?").max(20),
  category: z.string().min(1).max(20).optional(), // 없으면 서버가 재료 마스터에서 채운다
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜를 한 번만 더 봐줄래요?")
    .optional(), // 유통기한(선택) — 임박 재료 우선 추천에 쓰임 (PRD 5.2)
  storage: z.enum(STORAGES).optional(), // 냉장(기본) · 냉동
});

/** 냉장 ↔ 냉동 옮기기 — 보관 기한은 서버가 옮긴 시점부터 다시 추정한다. */
export const moveIngredientSchema = z.object({ storage: z.enum(STORAGES) });

/** 목록 조회 쿼리 (페이지네이션 — security.md §5). */
export const ingredientQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(300).default(300),
  category: z.string().max(20).optional(),
});

export type CreateIngredientRequest = z.infer<typeof createIngredientSchema>;

export interface IngredientResponse {
  id: string;
  name: string;
  category: string;
  rarity: string;
  expiresAt: string | null; // ISO 문자열 — 직접 적었거나 담을 때 추정한 값(shelfLife)
  emoji: string; // 팔레트·재료 마스터에서 찾은 이모지(없으면 🥗)
  storage: Storage;
}
