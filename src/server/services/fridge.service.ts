import "server-only";
import { db } from "@/server/db";
import { AppError } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import type { CreateIngredientRequest, IngredientResponse } from "@/features/fridge/types";

type IngredientRow = {
  id: string;
  name: string;
  category: string;
  rarity: string;
  expiresAt: Date | null;
};

function toResponse(i: IngredientRow): IngredientResponse {
  return {
    id: i.id,
    name: i.name,
    category: i.category,
    rarity: i.rarity,
    expiresAt: i.expiresAt ? i.expiresAt.toISOString() : null,
  };
}

export async function listIngredients(
  userId: string,
  page: number,
  size: number,
  category?: string,
): Promise<IngredientResponse[]> {
  const rows = await db.ingredient.findMany({
    where: { userId, ...(category ? { category } : {}) },
    orderBy: { createdAt: "desc" },
    skip: page * size,
    take: size,
  });
  return rows.map(toResponse);
}

export async function addIngredient(
  userId: string,
  input: CreateIngredientRequest,
): Promise<IngredientResponse> {
  const created = await db.ingredient.create({
    data: { userId, name: input.name, category: input.category },
  });
  return toResponse(created);
}

export async function removeIngredient(userId: string, id: string): Promise<void> {
  // 소유자 검증 (security.md §4) — 남의 재료는 못 지운다.
  const found = await db.ingredient.findUnique({ where: { id } });
  if (!found || found.userId !== userId) {
    throw new AppError("FORBIDDEN", messages.error.FORBIDDEN, 403);
  }
  await db.ingredient.delete({ where: { id } });
}
