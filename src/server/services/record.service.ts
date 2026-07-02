import "server-only";
import { db } from "@/server/db";
import { AppError } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import { advanceStreak } from "@/features/record/streak";
import { estimateSlot } from "@/features/record/slot";
import { balanceNudge, type Nudge } from "@/features/record/balance";
import { computeBMR, computeTDEE, ageFromBirthYear } from "@/features/record/energy";
import type {
  MarkMealRequest,
  MealRecordResponse,
  MealSlot,
  ProfileRequest,
  ProfileResponse,
  Gender,
  ActivityLevel,
  StreakResponse,
  TodayMealResponse,
  WeightLogResponse,
  DailyBudgetResponse,
} from "@/features/record/types";
import type { MochiState } from "@/types/mochi";
import type { Prisma } from "@prisma/client";

/** cook→recipe, convenience→convenience 도감. eatout은 도감 대상 아님(요리/재료/간편식만). */
function collectionTypeFor(mode: MarkMealRequest["mode"]): "recipe" | "convenience" | null {
  if (mode === "cook") return "recipe";
  if (mode === "convenience") return "convenience";
  return null;
}

/** 먹은 항목의 kcal 스냅샷 (서버 전용, 밸런싱 넛지 추세용 — 화면 노출 X 불변 #2). */
async function lookupKcal(
  tx: Prisma.TransactionClient,
  mode: MarkMealRequest["mode"],
  refId: string,
): Promise<number | null> {
  if (mode === "cook") return (await tx.recipe.findUnique({ where: { id: refId } }))?.kcal ?? null;
  if (mode === "eatout") return (await tx.menu.findUnique({ where: { id: refId } }))?.kcal ?? null;
  return (await tx.convenienceItem.findUnique({ where: { id: refId } }))?.kcal ?? null;
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
  const slot: MealSlot = input.slot ?? estimateSlot(now);

  return db.$transaction(async (tx) => {
    const kcal = input.refId ? await lookupKcal(tx, input.mode, input.refId) : null;
    const record = await tx.mealRecord.create({
      data: { userId, mode: input.mode, slot, refId: input.refId, kcal, memo: input.memo },
    });

    // 스트릭 + 보호권 (#9): 연속이면 +1, 빠지면 보호권이 막아주고, 없으면 오늘의 1부터 새 시작.
    const streak = await tx.streak.findUnique({ where: { userId } });
    const s = advanceStreak(
      { count: streak?.count ?? 0, shieldCount: streak?.shieldCount ?? 1 },
      streak?.lastCheckedAt ?? now,
      now,
    );
    if (streak) {
      await tx.streak.update({
        where: { userId },
        data: { count: s.count, shieldCount: s.shieldCount, lastCheckedAt: now },
      });
    } else {
      await tx.streak.create({
        data: { userId, count: s.count, shieldCount: s.shieldCount, lastCheckedAt: now },
      });
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

    return {
      recordId: record.id,
      mochiState,
      slot,
      streakCount: s.count,
      cardAcquired,
      shieldUsed: s.shieldUsed,
    };
  });
}

/** KST 자정의 UTC 순간 — 서버가 UTC(Vercel)라도 한국 기준 '오늘'을 정확히 자른다. */
function kstDayStart(nowMs = Date.now()): Date {
  const KST = 9 * 3_600_000;
  const shifted = nowMs + KST;
  return new Date(shifted - (shifted % 86_400_000) - KST);
}

/** 오늘(KST 자정 이후) 먹은 끼니 — 마이 '오늘의 기록' 스트립. 이른 순. detail이면 kcal 포함(#4). */
export async function listTodayMeals(userId: string): Promise<TodayMealResponse[]> {
  const since = kstDayStart();
  const [rows, user] = await Promise.all([
    db.mealRecord.findMany({
      where: { userId, eatenAt: { gte: since } },
      orderBy: { eatenAt: "asc" },
      select: { id: true, slot: true, mode: true, eatenAt: true, kcal: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { displayMode: true } }),
  ]);
  const detail = user?.displayMode === "detail";
  return rows.map((r) => ({
    id: r.id,
    slot: (r.slot ?? "snack") as MealSlot,
    mode: r.mode,
    eatenAt: r.eatenAt.toISOString(),
    kcal: detail ? r.kcal : null,
  }));
}

/** 오늘 기록 삭제(#2) — 실수 정정용. 소유자 검증. 스트릭·도감은 되돌리지 않음(죄책감 제로·단순). */
export async function deleteMealRecord(userId: string, id: string): Promise<void> {
  const record = await db.mealRecord.findUnique({ where: { id } });
  if (!record || record.userId !== userId) {
    throw new AppError("FORBIDDEN", messages.error.FORBIDDEN, 403);
  }
  await db.mealRecord.delete({ where: { id } });
}

/** 현재 스트릭 (홈 위젯·마이). 없으면 0 / 보호권 1. */
export async function getStreak(userId: string): Promise<StreakResponse> {
  const streak = await db.streak.findUnique({ where: { userId } });
  return { count: streak?.count ?? 0, shieldCount: streak?.shieldCount ?? 1 };
}

function toWeight(row: { id: string; weight: unknown; loggedAt: Date }): WeightLogResponse {
  return { id: row.id, weight: Number(row.weight), loggedAt: row.loggedAt.toISOString() };
}

export async function addWeight(
  userId: string,
  weight: number,
  loggedAt?: Date,
): Promise<WeightLogResponse> {
  const row = await db.weightLog.create({ data: { userId, weight, loggedAt } });
  return toWeight(row);
}

/** 최근 size개를 오름차순(과거→현재)으로 — 그래프용. */
export async function listWeights(userId: string, size: number): Promise<WeightLogResponse[]> {
  const rows = await db.weightLog.findMany({
    where: { userId },
    orderBy: { loggedAt: "desc" },
    take: size,
  });
  return rows.reverse().map(toWeight);
}

function toProfile(row: {
  birthYear: number | null;
  gender: string | null;
  heightCm: number | null;
  activityLevel: string | null;
} | null): ProfileResponse {
  const p = {
    birthYear: row?.birthYear ?? null,
    gender: (row?.gender ?? null) as ProfileResponse["gender"],
    heightCm: row?.heightCm ?? null,
    activityLevel: (row?.activityLevel ?? null) as ProfileResponse["activityLevel"],
  };
  return {
    ...p,
    personalized:
      p.birthYear != null && p.gender != null && p.heightCm != null && p.activityLevel != null,
  };
}

/** opt-in 프로필 조회 (PRD 11.4). 없으면 전부 null. */
export async function getProfile(userId: string): Promise<ProfileResponse> {
  return toProfile(await db.userProfile.findUnique({ where: { userId } }));
}

/** opt-in 프로필 저장(upsert). 마이 탭에서 원하는 사람만. */
export async function saveProfile(
  userId: string,
  input: ProfileRequest,
): Promise<ProfileResponse> {
  const data = {
    birthYear: input.birthYear ?? null,
    gender: input.gender ?? null,
    heightCm: input.heightCm ?? null,
    activityLevel: input.activityLevel ?? null,
  };
  const row = await db.userProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return toProfile(row);
}

/** 프로필 4항목 + 최신 체중이 모두 있으면 TDEE(kcal/day), 아니면 null. (넛지·예산 공용) */
async function computeUserTDEE(userId: string): Promise<number | null> {
  const [profile, latestWeight] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    db.weightLog.findFirst({ where: { userId }, orderBy: { loggedAt: "desc" } }),
  ]);
  if (
    profile?.birthYear == null ||
    profile.gender == null ||
    profile.heightCm == null ||
    profile.activityLevel == null ||
    latestWeight == null
  ) {
    return null;
  }
  const bmr = computeBMR(
    Number(latestWeight.weight),
    profile.heightCm,
    ageFromBirthYear(profile.birthYear),
    profile.gender as Gender,
  );
  return computeTDEE(bmr, profile.activityLevel as ActivityLevel);
}

/**
 * 밸런싱 넛지 (PRD 11.5) — 최근 끼니 kcal 추세(+opt-in 프로필 TDEE)로 오늘의 부드러운 제안.
 * 과거엔 벌 없음, 미래만 유도. kcal 숫자는 근거로만 쓰고 노출 안 함(불변 #2).
 */
export async function getBalanceNudge(userId: string): Promise<Nudge> {
  const [meals, tdee] = await Promise.all([
    db.mealRecord.findMany({
      where: { userId, kcal: { not: null } },
      orderBy: { eatenAt: "desc" },
      take: 9,
      select: { kcal: true },
    }),
    computeUserTDEE(userId),
  ]);
  const kcals = meals.map((m) => m.kcal).filter((k): k is number => k != null);
  return balanceNudge(kcals, tdee);
}

/**
 * 오늘의 kcal 예산 (#4 detail 모드) — TDEE. detail이 아니거나 프로필 미완비면 null(미표시).
 * 죄책감 제로: 초과해도 경고가 아니라 그냥 숫자. (섭취량은 클라가 오늘 끼니에서 합산)
 */
export async function getDailyBudget(userId: string): Promise<DailyBudgetResponse> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { displayMode: true } });
  if (user?.displayMode !== "detail") return { budget: null };
  return { budget: await computeUserTDEE(userId) };
}
