import "server-only";
import { db } from "@/server/db";
import { nextStreakCount } from "@/features/record/streak";
import type { MarkMealRequest, MealRecordResponse } from "@/features/record/types";
import type { MochiState } from "@/types/mochi";

/** cook→recipe, convenience→convenience 도감. eatout은 도감 대상 아님(요리/재료/간편식만). */
function collectionTypeFor(mode: MarkMealRequest["mode"]): "recipe" | "convenience" | null {
  if (mode === "cook") return "recipe";
  if (mode === "convenience") return "convenience";
  return null;
}

/**
 * '먹었어요' — 제안→기록→수집 루프의 기록 단계.
 * 한 트랜잭션으로: MealRecord 기록 + 스트릭 +1 + 도감 적립 + 모찌 cheer (structure.md 멀티스텝 쓰기).
 */
export async function markMealEaten(
  userId: string,
  input: MarkMealRequest,
): Promise<MealRecordResponse> {
  const now = new Date();

  return db.$transaction(async (tx) => {
    const record = await tx.mealRecord.create({
      data: { userId, mode: input.mode, memo: input.memo },
    });

    // 스트릭 (죄책감 제로: 끊지 않고 새 날에만 +1)
    const streak = await tx.streak.findUnique({ where: { userId } });
    const count = nextStreakCount(streak?.count ?? 0, streak?.lastCheckedAt ?? now, now);
    if (streak) {
      await tx.streak.update({ where: { userId }, data: { count, lastCheckedAt: now } });
    } else {
      await tx.streak.create({ data: { userId, count, lastCheckedAt: now } });
    }

    // 도감 적립 — 중복(이미 가진 카드)이면 추가 없음
    let cardAcquired = false;
    const type = collectionTypeFor(input.mode);
    if (type && input.refId) {
      const existing = await tx.collectionEntry.findUnique({
        where: { userId_type_refId: { userId, type, refId: input.refId } },
      });
      if (!existing) {
        await tx.collectionEntry.create({
          data: { userId, type, refId: input.refId, rarity: input.rarity },
        });
        cardAcquired = true;
      }
    }

    // 모찌 cheer 반응
    const mochiState: MochiState = "cheer";
    await tx.mochiProfile.upsert({
      where: { userId },
      create: { userId, state: mochiState },
      update: { state: mochiState },
    });

    return { recordId: record.id, mochiState, streakCount: count, cardAcquired };
  });
}
