import "server-only";
import { db } from "@/server/db";
import { AppError } from "@/lib/api-response";
import { buildCanonicalMap, canonicalize } from "@/features/fridge/canonical";
import {
  DRAW_COST,
  DUPE_REFUND,
  rollRarity,
  isPityReady,
  nextPity,
  pickIndex,
  type CardRarity,
} from "@/features/collection/gacha";
import type {
  CollectionTab,
  CollectibleResponse,
  CollectionResponse,
  MochiCardResponse,
  MochiCollectionResponse,
  DrawResultResponse,
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

// ── 모찌 뽑기 도감 (PRD 12) ──

function toMochiCard(
  c: { id: string; name: string; rarity: string; imageUrl: string; flavor: string },
  entry: { count: number; acquiredAt: Date } | null,
): MochiCardResponse {
  return {
    id: c.id,
    name: c.name,
    rarity: c.rarity,
    imageUrl: c.imageUrl,
    flavor: c.flavor,
    acquired: entry != null,
    count: entry?.count ?? 0,
    acquiredAt: entry?.acquiredAt.toISOString() ?? null,
  };
}

/** 모찌 도감 read — 카탈로그 16 ⋈ 내 획득(중복 count 포함) + 씨앗·뽑기비용. */
export async function getMochiCollection(userId: string): Promise<MochiCollectionResponse> {
  const [user, cards, entries] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { mochiSeeds: true } }),
    db.mochiCard.findMany({ orderBy: { sortOrder: "asc" } }),
    db.collectionEntry.findMany({ where: { userId, type: "mochi" } }),
  ]);
  const owned = new Map(entries.map((e) => [e.refId, e]));
  const list = cards.map((c) => toMochiCard(c, owned.get(c.id) ?? null));
  return {
    seeds: user?.mochiSeeds ?? 0,
    drawCost: DRAW_COST,
    total: cards.length,
    acquired: list.filter((c) => c.acquired).length,
    cards: list,
  };
}

/**
 * 뽑기 1회 (PRD 12.3~12.4) — 씨앗 차감 → 등급 가중랜덤(+10회 보장) → 카드 → 중복이면 환급+친밀도↑.
 * 한 트랜잭션으로 재화·pity·획득을 원자적으로.
 */
export async function drawMochiCard(userId: string): Promise<DrawResultResponse> {
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { mochiSeeds: true, drawPity: true },
    });
    if (!user || user.mochiSeeds < DRAW_COST) {
      throw new AppError("VALIDATION", "씨앗이 조금 더 모이면 뽑을 수 있어요 🌱", 400);
    }

    const rarity = rollRarity(Math.random(), isPityReady(user.drawPity));
    const pool = await tx.mochiCard.findMany({ where: { rarity } });
    const card = pool[pickIndex(pool.length, Math.random())];

    const existing = await tx.collectionEntry.findUnique({
      where: { userId_type_refId: { userId, type: "mochi", refId: card.id } },
    });
    const isNew = !existing;
    let refund = 0;
    let count = 1;
    if (existing) {
      const updated = await tx.collectionEntry.update({
        where: { id: existing.id },
        data: { count: { increment: 1 } },
      });
      count = updated.count;
      refund = DUPE_REFUND; // 중복은 낭비가 아니라 진행(씨앗 환급)
    } else {
      await tx.collectionEntry.create({
        data: { userId, type: "mochi", refId: card.id, rarity: card.rarity },
      });
    }

    const seedsLeft = user.mochiSeeds - DRAW_COST + refund;
    await tx.user.update({
      where: { id: userId },
      data: { mochiSeeds: seedsLeft, drawPity: nextPity(user.drawPity, rarity as CardRarity) },
    });

    return {
      card: toMochiCard(card, { count, acquiredAt: existing?.acquiredAt ?? new Date() }),
      isNew,
      refund,
      seedsLeft,
    };
  });
}
