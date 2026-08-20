import "server-only";
import { db } from "@/server/db";
import { markMealEaten } from "./record.service";
import { getRecommendations } from "./recommend.service";
import { AppError } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import type { AddPlanRequest, MovePlanRequest, PlannedMealResponse } from "@/features/recommend/plan";
import {
  weekdayOf,
  slotKey,
  planPresetApply,
  type SavePresetRequest,
  type ApplyPresetRequest,
  type ApplyPresetResult,
  type PresetResponse,
} from "@/features/recommend/preset";
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

/** 계획 이동(드래그 재배치) — 소유자 검증 후 날짜(그리고 선택적 끼니) 변경. */
export async function movePlan(
  userId: string,
  id: string,
  input: MovePlanRequest,
): Promise<PlannedMealResponse> {
  const plan = await db.plannedMeal.findUnique({ where: { id } });
  if (!plan || plan.userId !== userId) {
    throw new AppError("FORBIDDEN", messages.error.FORBIDDEN, 403);
  }
  const row = await db.plannedMeal.update({
    where: { id },
    data: { date: new Date(input.date), ...(input.slot ? { slot: input.slot } : {}) },
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

// ── 주간 프리셋 (매주 비슷하게 먹는 사람이 한 주치를 저장해 반복 적용) ──────────────

/** 내 프리셋 목록 — 적용 시트에서 고르게. 항목까지 함께 준다(개수 표시·미리보기용). */
export async function listPresets(userId: string): Promise<PresetResponse[]> {
  const rows = await db.mealPreset.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: [{ weekday: "asc" }, { slot: "asc" }] } },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    itemCount: p.items.length,
    items: p.items.map((i) => ({
      weekday: i.weekday,
      slot: i.slot as MealSlot | null,
      mode: i.mode as MealMode,
      refId: i.refId,
      title: i.title,
      emoji: i.emoji,
    })),
  }));
}

/**
 * 이번 주 계획을 프리셋으로 저장 — 빈 화면에서 만들게 하지 않고, 이미 짜둔 주를 재사용한다.
 * 날짜가 아니라 **요일**로 저장해야 다음 주에도 쓸 수 있다(preset.ts).
 */
export async function savePreset(
  userId: string,
  input: SavePresetRequest,
): Promise<PresetResponse> {
  const rows = await db.plannedMeal.findMany({
    where: { userId, date: { in: input.dates.map((d) => new Date(d)) } },
    orderBy: { date: "asc" },
  });
  if (rows.length === 0) {
    throw new AppError("VALIDATION", "저장할 식단이 아직 없어요. 먼저 한 끼 담아볼까요?", 400);
  }

  const created = await db.mealPreset.create({
    data: {
      userId,
      name: input.name,
      items: {
        create: rows.map((r) => ({
          weekday: weekdayOf(r.date.toISOString().slice(0, 10)),
          slot: r.slot,
          mode: r.mode,
          refId: r.refId,
          title: r.title,
          emoji: r.emoji,
        })),
      },
    },
    include: { items: true },
  });

  return {
    id: created.id,
    name: created.name,
    itemCount: created.items.length,
    items: created.items.map((i) => ({
      weekday: i.weekday,
      slot: i.slot as MealSlot | null,
      mode: i.mode as MealMode,
      refId: i.refId,
      title: i.title,
      emoji: i.emoji,
    })),
  };
}

/**
 * 프리셋을 그 주에 적용 — **빈 자리만 채운다.** 이미 담아둔 끼니나 먹은 기록은 건드리지 않는다
 * (덮어쓰면 공들여 짠 계획이 조용히 사라진다). 무엇을 건너뛰었는지 개수로 알려준다.
 */
export async function applyPreset(
  userId: string,
  presetId: string,
  input: ApplyPresetRequest,
): Promise<ApplyPresetResult> {
  const preset = await db.mealPreset.findFirst({
    where: { id: presetId, userId }, // 소유자 검증 (security.md §4)
    include: { items: true },
  });
  if (!preset) throw new AppError("NOT_FOUND", messages.error.NOT_FOUND, 404);

  const dates = input.dates.map((d) => new Date(d));
  const existing = await db.plannedMeal.findMany({
    where: { userId, date: { in: dates } },
    select: { date: true, slot: true },
  });
  const occupied = new Set(
    existing.map((e) => slotKey(weekdayOf(e.date.toISOString().slice(0, 10)), e.slot as MealSlot | null)),
  );

  const { toCreate, skipped } = planPresetApply(
    input.dates,
    preset.items.map((i) => ({
      weekday: i.weekday,
      slot: i.slot as MealSlot | null,
      mode: i.mode as MealMode,
      refId: i.refId,
      title: i.title,
      emoji: i.emoji,
    })),
    occupied,
  );

  if (toCreate.length > 0) {
    await db.plannedMeal.createMany({
      data: toCreate.map((c) => ({
        userId,
        date: new Date(c.date),
        slot: c.slot,
        mode: c.mode,
        refId: c.refId,
        title: c.title,
        emoji: c.emoji,
      })),
    });
  }
  return { added: toCreate.length, skipped };
}

/** 프리셋 삭제 — 소유자 검증. 항목은 cascade로 함께 지워진다. */
export async function removePreset(userId: string, presetId: string): Promise<void> {
  const { count } = await db.mealPreset.deleteMany({ where: { id: presetId, userId } });
  if (count === 0) throw new AppError("NOT_FOUND", messages.error.NOT_FOUND, 404);
}
