import "server-only";
import { db } from "@/server/db";
import type { MochiState } from "@/types/mochi";
import type { MochiStateResponse } from "@/features/mochi/types";

/**
 * 모찌 상태 — 숫자가 아니라 표정으로 진행도를 전한다 (불변 #2).
 * 파생 규칙: 밤(23~6시)→sleepy · 오늘 먹은 기록 있으면→happy · 그 외→idle.
 * 성장 단계는 모은 도감 카드 수로(수집=성장, PRD 7장). 비로그인은 시간대만.
 */
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getMochiState(userId: string | null): Promise<MochiStateResponse> {
  const now = new Date();
  const isNight = now.getHours() >= 23 || now.getHours() < 6;

  if (!userId) {
    return { state: isNight ? "sleepy" : "idle", growthStage: 1, collectedCount: 0 };
  }

  const [collectedCount, ateToday] = await Promise.all([
    db.collectionEntry.count({ where: { userId } }),
    db.mealRecord.count({ where: { userId, eatenAt: { gte: startOfDay(now) } } }),
  ]);

  let state: MochiState;
  if (isNight) state = "sleepy";
  else if (ateToday > 0) state = "happy";
  else state = "idle";

  const growthStage = Math.min(5, 1 + Math.floor(collectedCount / 3));
  return { state, growthStage, collectedCount };
}
