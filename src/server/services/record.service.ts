import "server-only";
import { db } from "@/server/db";
import { signMealPhoto } from "@/server/storage/photo-storage";
import { AppError } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import { advanceStreak } from "@/features/record/streak";
import { estimateSlot } from "@/features/record/slot";
import { balanceNudge, type Nudge } from "@/features/record/balance";
import {
  buildMealHistory,
  availableMonths,
  kstDayKey as kstDayKeyOf,
  type HistoryMeal,
} from "@/features/record/history";
import { mealSeeds, cappedSeedGrant, DRAW_COST } from "@/features/collection/gacha";
import {
  computeBMR,
  computeTDEE,
  computeCalorieBudget,
  ageFromBirthYear,
} from "@/features/record/energy";
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
  MealHistoryResponse,
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
  photoUrl?: string, // 사진 한 장 기록(PRD 8-3) — 스토리지 경로. 일반 '먹었어요'는 undefined.
): Promise<MealRecordResponse> {
  const now = new Date();
  const slot: MealSlot = input.slot ?? estimateSlot(now);

  return db.$transaction(async (tx) => {
    const kcal = input.refId ? await lookupKcal(tx, input.mode, input.refId) : null;
    const record = await tx.mealRecord.create({
      data: { userId, mode: input.mode, slot, refId: input.refId, kcal, memo: input.memo, photoUrl },
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

    // 뽑기 재화(씨앗) 적립 (PRD 12.2) — 건강 행동으로만. 첫 발견·스트릭 이어감 보너스.
    const streakAdvanced = s.count > (streak?.count ?? 0);
    const want = mealSeeds({ firstDiscovery: cardAcquired, streakAdvanced, streakCount: s.count });
    // 일일 상한 — 등록/취소 반복 farming 방지. seedsToday는 삭제해도 안 줄어드는 그날 누적치.
    const today = kstDayKey(now.getTime());
    const acct = await tx.user.findUnique({
      where: { id: userId },
      select: { seedDay: true, seedsToday: true },
    });
    const usedToday = acct?.seedDay === today ? acct.seedsToday : 0;
    const seedsEarned = cappedSeedGrant(want, usedToday);
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        mochiSeeds: { increment: seedsEarned },
        seedDay: today,
        seedsToday: usedToday + seedsEarned,
      },
      select: { mochiSeeds: true },
    });

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
      seedsEarned,
      canDraw: updated.mochiSeeds >= DRAW_COST, // 기록→뽑기 브릿지 — 뽑기 가능 여부는 서버가 결정
    };
  });
}

/** 한국 기준 오늘 날짜 키(YYYY-MM-DD) — 씨앗 일일 상한 추적용. */
function kstDayKey(nowMs = Date.now()): string {
  return new Date(nowMs + 9 * 3_600_000).toISOString().slice(0, 10);
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
      select: { id: true, slot: true, mode: true, eatenAt: true, kcal: true, photoUrl: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { displayMode: true } }),
  ]);
  const detail = user?.displayMode === "detail";
  // 사진 있는 기록만 서명 URL 발급(비공개 버킷). 대부분 사진이 없어 서명 호출은 최소.
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      slot: (r.slot ?? "snack") as MealSlot,
      mode: r.mode,
      eatenAt: r.eatenAt.toISOString(),
      kcal: detail ? r.kcal : null,
      photoUrl: r.photoUrl ? await signMealPhoto(r.photoUrl) : null,
    })),
  );
}

/** refId(mode별 카탈로그 id) → 먹은 요리/메뉴 이름 맵. 회고 타임라인에서 "저녁 · 제육볶음"으로 보이게. */
async function resolveMealTitles(
  rows: { mode: string; refId: string | null }[],
): Promise<Map<string, string>> {
  const ids = { cook: new Set<string>(), eatout: new Set<string>(), convenience: new Set<string>() };
  for (const r of rows) {
    if (r.refId && (r.mode === "cook" || r.mode === "eatout" || r.mode === "convenience")) {
      ids[r.mode].add(r.refId);
    }
  }
  const [recipes, menus, convs] = await Promise.all([
    ids.cook.size
      ? db.recipe.findMany({ where: { id: { in: [...ids.cook] } }, select: { id: true, name: true } })
      : Promise.resolve([]),
    ids.eatout.size
      ? db.menu.findMany({ where: { id: { in: [...ids.eatout] } }, select: { id: true, name: true } })
      : Promise.resolve([]),
    ids.convenience.size
      ? db.convenienceItem.findMany({
          where: { id: { in: [...ids.convenience] } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);
  const map = new Map<string, string>();
  for (const c of [...recipes, ...menus, ...convs]) map.set(c.id, c.name);
  return map;
}

/**
 * 식사·체중 회고 타임라인 (마이 '기록 되돌아보기', PRD 6장 회고 흐름).
 * 월(month)을 골라 그 달을 page 단위로 돌려준다. detail이면 kcal 포함(#4).
 * delta는 전체 기록 기준으로 계산한 뒤 월/페이지로 잘라, 달 경계를 넘는 "다음날 체중"도 정확.
 * 사진은 반환하는 페이지분만 서명(비공개 버킷) — 페이지 밖은 서명 호출 안 함.
 */
export async function listMealHistory(
  userId: string,
  opts: { month?: string; page: number; size: number },
): Promise<MealHistoryResponse> {
  const [mealRows, weightRows, user] = await Promise.all([
    db.mealRecord.findMany({
      where: { userId },
      orderBy: { eatenAt: "desc" },
      select: { id: true, slot: true, mode: true, refId: true, kcal: true, photoUrl: true, eatenAt: true },
    }),
    db.weightLog.findMany({
      where: { userId },
      orderBy: { loggedAt: "desc" },
      select: { weight: true, loggedAt: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { displayMode: true } }),
  ]);
  const detail = user?.displayMode === "detail";
  const titles = await resolveMealTitles(mealRows);

  // 사진 경로는 아직 서명 전(raw) — 월/페이지로 슬라이스 후 반환분만 서명한다.
  const meals: HistoryMeal[] = mealRows.map((r) => ({
    id: r.id,
    slot: r.slot,
    mode: r.mode,
    title: r.refId ? (titles.get(r.refId) ?? null) : null,
    kcal: detail ? r.kcal : null,
    photoUrl: r.photoUrl, // raw 경로
    eatenAt: r.eatenAt.toISOString(),
  }));
  const weights = weightRows.map((w) => ({ weight: Number(w.weight), loggedAt: w.loggedAt.toISOString() }));

  const allDays = buildMealHistory(meals, weights); // 전체(delta 계산 위해)
  const months = availableMonths(allDays);
  // 요청 달이 유효하면 그 달, 아니면 가장 최근 기록 달, 기록이 없으면 이번 달(KST).
  const month =
    opts.month && months.includes(opts.month)
      ? opts.month
      : (months[0] ?? kstDayKeyOf(new Date().toISOString()).slice(0, 7));

  const monthDays = allDays.filter((d) => d.date.startsWith(month));
  const totalPages = Math.max(1, Math.ceil(monthDays.length / opts.size));
  const page = Math.min(Math.max(0, opts.page), totalPages - 1);
  const days = monthDays.slice(page * opts.size, page * opts.size + opts.size);

  // 반환 페이지분의 사진만 서명 URL로 (대부분 사진 없어 서명 호출 최소)
  await Promise.all(
    days.flatMap((day) =>
      day.meals.map(async (m) => {
        if (m.photoUrl) m.photoUrl = await signMealPhoto(m.photoUrl);
      }),
    ),
  );

  return { months, month, page, totalPages, days };
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

/** 프로필 4항목 + 최신 체중이 모두 있으면 {bmr, tdee}(kcal/day), 아니면 null. (넛지·예산 공용) */
async function computeUserEnergy(userId: string): Promise<{ bmr: number; tdee: number } | null> {
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
  return { bmr, tdee: computeTDEE(bmr, profile.activityLevel as ActivityLevel) };
}

/**
 * 밸런싱 넛지 (PRD 11.5) — 최근 끼니 kcal 추세(+opt-in 프로필 TDEE)로 오늘의 부드러운 제안.
 * 과거엔 벌 없음, 미래만 유도. kcal 숫자는 근거로만 쓰고 노출 안 함(불변 #2).
 */
export async function getBalanceNudge(userId: string): Promise<Nudge> {
  const [meals, energy] = await Promise.all([
    db.mealRecord.findMany({
      where: { userId, kcal: { not: null } },
      orderBy: { eatenAt: "desc" },
      take: 9,
      select: { kcal: true },
    }),
    computeUserEnergy(userId),
  ]);
  const kcals = meals.map((m) => m.kcal).filter((k): k is number => k != null);
  return balanceNudge(kcals, energy?.tdee ?? null);
}

/**
 * 오늘의 kcal 예산 (#4 detail 모드) — 감량 목표(유지 TDEE보다 적게, BMR 하한).
 * detail이 아니거나 프로필 미완비면 null(미표시).
 * 죄책감 제로: 초과해도 경고가 아니라 그냥 숫자. (섭취량은 클라가 오늘 끼니에서 합산)
 */
export async function getDailyBudget(userId: string): Promise<DailyBudgetResponse> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { displayMode: true } });
  if (user?.displayMode !== "detail") return { budget: null };
  const energy = await computeUserEnergy(userId);
  return { budget: energy ? computeCalorieBudget(energy.tdee, energy.bmr) : null };
}
