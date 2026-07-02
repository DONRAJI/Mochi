import "server-only";
import { db } from "@/server/db";
import { AppError } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import type { ShoppingItemResponse } from "@/features/fridge/shopping";

/** 장보기 리스트 (PRD 5.3) — 미체크 먼저, 담은 순. */
export async function listShopping(userId: string): Promise<ShoppingItemResponse[]> {
  const rows = await db.shoppingItem.findMany({
    where: { userId },
    orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((r) => ({ id: r.id, name: r.name, checked: r.checked }));
}

/** 여러 재료 담기(중복은 무시 — userId+name unique). 추가구매 재료 한 번에. */
export async function addShopping(userId: string, names: string[]): Promise<ShoppingItemResponse[]> {
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  await Promise.all(
    clean.map((name) =>
      db.shoppingItem.upsert({
        where: { userId_name: { userId, name } },
        create: { userId, name },
        update: {},
      }),
    ),
  );
  return listShopping(userId);
}

export async function toggleShopping(userId: string, id: string): Promise<void> {
  const item = await db.shoppingItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) {
    throw new AppError("FORBIDDEN", messages.error.FORBIDDEN, 403);
  }
  await db.shoppingItem.update({ where: { id }, data: { checked: !item.checked } });
}

export async function removeShopping(userId: string, id: string): Promise<void> {
  const item = await db.shoppingItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) {
    throw new AppError("FORBIDDEN", messages.error.FORBIDDEN, 403);
  }
  await db.shoppingItem.delete({ where: { id } });
}

/** 체크한 항목을 냉장고로 옮긴다(샀으니까). 냉장고 담기 + 리스트에서 제거를 한 트랜잭션으로. */
export async function moveCheckedToFridge(userId: string): Promise<ShoppingItemResponse[]> {
  const checked = await db.shoppingItem.findMany({ where: { userId, checked: true } });
  if (checked.length > 0) {
    await db.$transaction([
      ...checked.map((c) =>
        db.ingredient.create({ data: { userId, name: c.name, category: "기타" } }),
      ),
      db.shoppingItem.deleteMany({ where: { userId, checked: true } }),
    ]);
  }
  return listShopping(userId);
}
