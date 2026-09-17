/**
 * 한국 시간(KST, UTC+9) 기준 날짜·시각 — 서버(Vercel)는 UTC라 `getHours()`·`setHours(0)`를 쓰면
 * 하루 경계가 한국 오전 9시로 밀린다(아침 8시 기록이 '어제'가 되고, 오전 8시~오후 3시가 '밤'이 된다).
 * 서비스 대상이 한국이라 기기·서버 시간대와 무관하게 늘 KST로 계산한다. 순수 함수.
 */

export const KST_OFFSET_MS = 9 * 3_600_000;
const DAY_MS = 86_400_000;

/** KST 달력 기준 일 번호 — 두 시각의 차이가 곧 '지난 날 수'. */
export function kstDayNumber(ms: number): number {
  return Math.floor((ms + KST_OFFSET_MS) / DAY_MS);
}

/** KST 날짜 키 "YYYY-MM-DD". */
export function kstDayKey(ms = Date.now()): string {
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 그 시각이 속한 KST 하루의 시작(자정) 순간. */
export function kstDayStart(ms = Date.now()): Date {
  return new Date(kstDayNumber(ms) * DAY_MS - KST_OFFSET_MS);
}

/** KST 시(0~23). */
export function kstHour(ms = Date.now()): number {
  return new Date(ms + KST_OFFSET_MS).getUTCHours();
}

/** KST 요일 (0=일 … 6=토). 일 번호 0(1970-01-01)이 목요일. */
export function kstWeekday(ms = Date.now()): number {
  return (kstDayNumber(ms) + 4) % 7;
}

/** "YYYY-MM" → 그 달의 KST 시작 순간 이상 · 다음 달 시작 미만. */
export function kstMonthRange(month: string): { gte: Date; lt: Date } {
  const [y, m] = month.split("-").map(Number);
  return {
    gte: new Date(Date.UTC(y, m - 1, 1) - KST_OFFSET_MS),
    lt: new Date(Date.UTC(y, m, 1) - KST_OFFSET_MS),
  };
}
