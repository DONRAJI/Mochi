import "server-only";
import { db } from "@/server/db";
import { buildCanonicalMap, canonicalize } from "@/features/fridge/canonical";
import type {
  CollectionTab,
  CollectibleResponse,
  CollectionResponse,
} from "@/features/collection/types";

/** 미획득 티저(실루엣)로 보여줄 최대 개수 — 레시피처럼 카탈로그가 클 때. */
const TEASER_LIMIT = 12;

type CatalogRow = { id: string; name: string; emoji: string | null; rarity: string };

function toCard(r: CatalogRow, acquired: boolean, acquiredAt: Date | null): CollectibleResponse {
  return {
    refId: r.id,
    name: r.name,
    emoji: r.emoji,
    rarity: r.rarity,
    acquired,
    acquiredAt: acquiredAt?.toISOString() ?? null,
  };
}

/**
 * 도감 read — 게이지엔 전체/획득 수, 그리드엔 items.
 * recipe: 카탈로그 1150개라 '획득분 전부 + 미획득 티저 12개'만(1150 카드 렌더 회피).
 * ingredient/convenience: 카탈로그가 작아 전부. ingredient는 재료 마스터 ⋈ 현재 냉장고.
 */
export async function listCollection(
  userId: string,
  type: CollectionTab,
): Promise<CollectionResponse> {
  const entries = await db.collectionEntry.findMany({ where: { userId, type } });
  const acquiredAt = new Map(entries.map((e) => [e.refId, e.acquiredAt]));

  if (type === "recipe") {
    const acquiredIds = entries.map((e) => e.refId);
    const [total, acquiredRecipes, teasers] = await Promise.all([
      db.recipe.count(),
      acquiredIds.length
        ? db.recipe.findMany({ where: { id: { in: acquiredIds } } })
        : Promise.resolve([] as CatalogRow[]),
      // 미획득 티저: 희귀도 높은 순(seasonal>epic>rare>common)으로 몇 개만 — 수집욕 자극
      db.recipe.findMany({
        where: acquiredIds.length ? { id: { notIn: acquiredIds } } : {},
        orderBy: { rarity: "desc" },
        take: TEASER_LIMIT,
      }),
    ]);
    const items = [
      ...acquiredRecipes.map((r) => toCard(r, true, acquiredAt.get(r.id) ?? null)),
      ...teasers.map((r) => toCard(r, false, null)),
    ];
    return { total, acquired: acquiredRecipes.length, items };
  }

  if (type === "convenience") {
    const catalog = await db.convenienceItem.findMany();
    const items = catalog.map((c) => toCard(c, acquiredAt.has(c.id), acquiredAt.get(c.id) ?? null));
    return { total: items.length, acquired: items.filter((i) => i.acquired).length, items };
  }

  // ingredient: 재료 마스터 ⋈ 현재 냉장고(보유=발견, 별칭 정규화)
  const [masters, fridge] = await Promise.all([
    db.ingredientMaster.findMany(),
    db.ingredient.findMany({ where: { userId }, select: { name: true } }),
  ]);
  const canon = buildCanonicalMap(masters);
  const owned = new Set(fridge.map((f) => canonicalize(f.name, canon)));
  const items = masters.map((m) => ({
    refId: m.name,
    name: m.name,
    emoji: m.emoji,
    rarity: m.rarity,
    acquired: owned.has(m.name),
    acquiredAt: null,
  }));
  return { total: items.length, acquired: items.filter((i) => i.acquired).length, items };
}
