/**
 * 스트릭 계산 (순수 함수). 제품 철학(불변 #1, "하루 빠져도 안 깨져요"):
 * 끊거나 0으로 리셋하지 않는다 — 기록한 새 날에만 +1, 같은 날 추가 기록은 유지.
 */
function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function isNewDay(last: Date, now: Date): boolean {
  return startOfDay(last) < startOfDay(now);
}

export function nextStreakCount(current: number, last: Date, now: Date): number {
  if (current <= 0) return 1; // 첫 기록
  return isNewDay(last, now) ? current + 1 : current;
}
