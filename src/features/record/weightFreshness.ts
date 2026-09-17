import { kstDayNumber } from "@/lib/kst";

/**
 * 체중 기록이 오래됐는지 (순수) — 칼로리 예산(energy.ts)은 **가장 최근 체중**으로 계산하므로,
 * 한 달 전 체중이면 빠진 만큼 예산이 실제보다 높게 나온다. 오래됐을 때만 부드럽게 한 줄 권한다.
 * 재촉이 아니라 "지금 몸에 맞추기" 제안이라 며칠 수는 말하지 않는다(불변 #1).
 */
export const WEIGHT_STALE_DAYS = 14;

export function isWeightStale(lastLoggedAtMs: number | null, nowMs = Date.now()): boolean {
  if (lastLoggedAtMs == null) return false; // 기록이 없으면 예산 자체가 없다 — 권할 대상이 아님
  return kstDayNumber(nowMs) - kstDayNumber(lastLoggedAtMs) >= WEIGHT_STALE_DAYS;
}
