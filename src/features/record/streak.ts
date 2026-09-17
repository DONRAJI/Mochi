/**
 * 스트릭 계산 (순수 함수). #9 — 연속 기록 + 보호권(🛡️).
 * - 연속(하루 간격)이면 +1, 같은 날 추가 기록은 유지.
 * - 하루 이상 빠지면: 보호권이 있으면 소진하고 이어감(+1), 없으면 오늘의 1부터 새 시작(0 아님).
 * - 연속 7일마다 보호권 +1 (최대 3). 죄책감 제로: 리셋도 '새로운 시작', 비난 없음.
 */
import { kstDayNumber } from "@/lib/kst";

const SHIELD_CAP = 3;
const REGEN_EVERY = 7;

/**
 * 마지막 기록일→오늘 사이 한국(KST) 달력 기준 하루 수 (0=같은 날, 1=어제 이어서, ≥2=빠진 날 있음).
 * 이 함수는 서버(UTC)에서 돈다 — 예전 `setHours(0)`는 하루 경계가 한국 오전 9시라, 같은 날 아침 8시·
 * 10시 기록이 이틀로 세져 스트릭이 +1 되고, 밤 11시·다음 날 아침 8시는 같은 날로 세져 안 올랐다.
 */
export function dayGap(last: Date, now: Date): number {
  return kstDayNumber(now.getTime()) - kstDayNumber(last.getTime());
}

export interface StreakState {
  count: number;
  shieldCount: number;
}

export interface StreakResult {
  count: number;
  shieldCount: number;
  shieldUsed: boolean; // 보호권이 이번에 빈 날을 막았는지
}

/** 기록 한 번에 대한 스트릭·보호권 다음 상태. */
export function advanceStreak(prev: StreakState, last: Date, now: Date): StreakResult {
  const gap = dayGap(last, now);

  // 같은 날(또는 시계 역행) 추가 기록 — 변화 없음
  if (prev.count > 0 && gap <= 0) {
    return { count: prev.count, shieldCount: prev.shieldCount, shieldUsed: false };
  }

  let count: number;
  let shieldCount = prev.shieldCount;
  let shieldUsed = false;

  if (prev.count <= 0) {
    count = 1; // 첫 기록
  } else if (gap === 1) {
    count = prev.count + 1; // 연속
  } else if (shieldCount >= 1) {
    count = prev.count + 1; // 보호권이 빈 날을 막아줌
    shieldCount -= 1;
    shieldUsed = true;
  } else {
    count = 1; // 보호권 없이 빠짐 → 오늘부터 새 시작(리셋은 0이 아니라 1)
  }

  // 연속 7일마다 보호권 +1 (최대 3)
  if (count % REGEN_EVERY === 0) {
    shieldCount = Math.min(SHIELD_CAP, shieldCount + 1);
  }

  return { count, shieldCount, shieldUsed };
}
