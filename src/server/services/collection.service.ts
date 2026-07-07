import "server-only";
import { db } from "@/server/db";
import { AppError } from "@/lib/api-response";
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
  MochiCardResponse,
  MochiCollectionResponse,
  DrawResultResponse,
} from "@/features/collection/types";

// ── 모찌 뽑기 도감 (PRD 12) — 수집 = 리텐션 엔진 ──

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

/** 모찌 도감 read — 카탈로그 ⋈ 내 획득(중복 count 포함) + 씨앗·뽑기비용. */
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
    if (!card) {
      // 해당 등급 카드가 아직 없을 때(예: 시즌 카드 미시드) 크래시 대신 부드러운 안내.
      throw new AppError("INTERNAL", "지금은 뽑을 카드가 없어요. 잠시 후 다시 해볼까요?", 500);
    }

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
