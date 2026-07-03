import "server-only";
import { db } from "@/server/db";
import { markMealEaten } from "./record.service";
import { getRecommendations } from "./recommend.service";
import { AppError } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import type { AddPlanRequest, PlannedMealResponse } from "@/features/recommend/plan";
import type { MealMode } from "@/features/recommend/types";
import type { MealRecordResponse, MealSlot } from "@/features/record/types";

/**
 * 주간 식단 계획 (PRD 4.3·5.3). record(과거)와 대칭인 미래 끼니.
 * 소유자 검증은 서비스 레이어에서(security.md §4). 계획을 '먹었어요'하면 기존 기록 루프로 이어진다.
 */
function toPlan(row: {
  id: string;
  date: Date;
  slot: string | null;
  mode: string;
  refId: string | null;
  title: string;
  emoji: string | null;
  eaten: boolean;
}): PlannedMealResponse {
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    slot: row.slot as MealSlot | null,
    mode: row.mode as MealMode,
    refId: row.refId,
    title: row.title,
    emoji: row.emoji,
    eaten: row.eaten,
  };
}

export async function listPlan(
  userId: string,
  from: string,
  to: string,
): Promise<PlannedMealResponse[]> {
  const rows = await db.plannedMeal.findMany({
    where: { userId, date: { gte: new Date(from), lte: new Date(to) } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toPlan);
}

/**
 * 이번 주 빈 날을 cook 추천으로 자동 채운다 (PRD 4.3 위클리 루프).
 * 이미 계획된 날은 건너뛰고, 상위 추천을 로테이션으로 배정해 날마다 다르게.
 */
export async function autoFillWeek(
  userId: string,
  dates: string[],
): Promise<PlannedMealResponse[]> {
  const existing = await db.plannedMeal.findMany({
    where: { userId, date: { in: dates.map((d) => new Date(d)) } },
    select: { date: true },
  });
  const planned = new Set(existing.map((e) => e.date.toISOString().slice(0, 10)));
  const empty = dates.filter((d) => !planned.has(d));

  if (empty.length > 0) {
    const recs = await getRecommendations("cook", userId, 0, 20);
    if (recs.length > 0) {
      await Promise.all(
        empty.map((date, i) => {
          const r = recs[i % recs.length];
          // 자동 채우기는 '오늘 저녁 뭐 먹지'가 기본 — 하루 대표 한 끼(저녁)로 배정(끼니 구조 유지).
          return db.plannedMeal.create({
            data: { userId, date: new Date(date), slot: "dinner", mode: "cook", refId: r.id, title: r.name, emoji: r.emoji },
          });
        }),
      );
    }
  }
  return listPlan(userId, dates[0], dates[dates.length - 1]);
}

export async function addPlan(
  userId: string,
  input: AddPlanRequest,
): Promise<PlannedMealResponse> {
  const row = await db.plannedMeal.create({
    data: {
      userId,
      date: new Date(input.date),
      slot: input.slot,
      mode: input.mode,
      refId: input.refId,
      title: input.title,
      emoji: input.emoji,
    },
  });
  return toPlan(row);
}

export async function removePlan(userId: string, id: string): Promise<void> {
  const plan = await db.plannedMeal.findUnique({ where: { id } });
  if (!plan || plan.userId !== userId) {
    throw new AppError("FORBIDDEN", messages.error.FORBIDDEN, 403);
  }
  await db.plannedMeal.delete({ where: { id } });
}

/** 계획한 끼니를 '먹었어요' → 기존 기록 루프(스트릭·도감·모찌) + 계획을 완료 처리. */
export async function eatPlan(userId: string, id: string): Promise<MealRecordResponse> {
  const plan = await db.plannedMeal.findUnique({ where: { id } });
  if (!plan || plan.userId !== userId) {
    throw new AppError("FORBIDDEN", messages.error.FORBIDDEN, 403);
  }
  const result = await markMealEaten(userId, {
    mode: plan.mode,
    slot: plan.slot ?? undefined,
    refId: plan.refId ?? undefined,
    rarity: "common",
  });
  await db.plannedMeal.update({ where: { id }, data: { eaten: true } });
  return result;
}
