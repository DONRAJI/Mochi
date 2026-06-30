import "server-only";
import { db } from "@/server/db";
import { COMMON_INGREDIENTS } from "@/features/fridge/ingredients";
import type { CollectionTab, CollectibleResponse } from "@/features/collection/types";

/**
 * 도감 read — 전체 카탈로그에 내 획득 여부를 합쳐 보여준다(획득=풀컬러, 미획득=실루엣).
 * recipe/convenience는 시드 카탈로그 ⋈ CollectionEntry.
 * ingredient는 (재료 마스터 없으니 P0 근사) 팔레트 ⋈ 현재 냉장고 보유 — Phase 1C에서 마스터로 교체.
 */
export async function listCollection(
  userId: string,
  type: CollectionTab,
): Promise<CollectibleResponse[]> {
  const entries = await db.collectionEntry.findMany({ where: { userId, type } });
  const acquiredAt = new Map(entries.map((e) => [e.refId, e.acquiredAt]));

  if (type === "recipe") {
    const recipes = await db.recipe.findMany();
    return recipes.map((r) => ({
      refId: r.id,
      name: r.name,
      emoji: r.emoji,
      rarity: r.rarity,
      acquired: acquiredAt.has(r.id),
      acquiredAt: acquiredAt.get(r.id)?.toISOString() ?? null,
    }));
  }

  if (type === "convenience") {
    const items = await db.convenienceItem.findMany();
    return items.map((c) => ({
      refId: c.id,
      name: c.name,
      emoji: c.emoji,
      rarity: c.rarity,
      acquired: acquiredAt.has(c.id),
      acquiredAt: acquiredAt.get(c.id)?.toISOString() ?? null,
    }));
  }

  // ingredient: 팔레트 카탈로그 ⋈ 현재 냉장고(보유=발견)
  const fridge = await db.ingredient.findMany({ where: { userId }, select: { name: true } });
  const owned = new Set(fridge.map((f) => f.name));
  return COMMON_INGREDIENTS.map((p) => ({
    refId: p.name,
    name: p.name,
    emoji: p.emoji,
    rarity: "common",
    acquired: owned.has(p.name),
    acquiredAt: null,
  }));
}
