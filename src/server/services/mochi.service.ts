import "server-only";
import { db } from "@/server/db";
import { DRAW_COST } from "@/features/collection/gacha";
import type { MochiState } from "@/types/mochi";
import type { MochiStateResponse } from "@/features/mochi/types";

/**
 * 모찌 상태 — 숫자가 아니라 표정으로 진행도를 전한다 (불변 #2).
 * 파생 규칙: 밤(23~6시)→sleepy · 오늘 먹은 기록 있으면→happy · 그 외→idle.
 * 성장 단계는 모은 **모찌 카드** 수로(수집=성장, PRD 7장·12). 비로그인은 시간대만.
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
    return {
      state: isNight ? "sleepy" : "idle",
      growthStage: 1,
      collectedCount: 0,
      seeds: 0,
      drawCost: DRAW_COST,
    };
  }

  // 씨앗은 첫 안내(StartHereCard)가 쓰는 값 — 홈에서 도감 전체를 또 부르지 않으려고 여기서 함께.
  const [collectedCount, ateToday, user] = await Promise.all([
    // ⚠️ `type: "mochi"` 필수. markMealEaten은 '먹었어요' 때마다 음식 CollectionEntry
    // (recipe/convenience)도 만든다 — 가챠 개편 전 음식 도감의 잔재로, 지금은 화면에 안 뜨고
    // '첫 발견' 감지용으로만 쓰인다. 타입을 안 거르면 한 끼만 기록해도 카드를 얻은 것으로
    // 집계돼 모찌가 멋대로 자라고, 도감(collection.service는 type:"mochi"로 거름)과 어긋난다.
    db.collectionEntry.count({ where: { userId, type: "mochi" } }),
    db.mealRecord.count({ where: { userId, eatenAt: { gte: startOfDay(now) } } }),
    db.user.findUnique({ where: { id: userId }, select: { mochiSeeds: true } }),
  ]);

  let state: MochiState;
  if (isNight) state = "sleepy";
  else if (ateToday > 0) state = "happy";
  else state = "idle";

  const growthStage = Math.min(5, 1 + Math.floor(collectedCount / 3));
  return { state, growthStage, collectedCount, seeds: user?.mochiSeeds ?? 0, drawCost: DRAW_COST };
}
