/**
 * 주간 캘린더 날짜 유틸 (순수). 클라이언트(브라우저 로컬=KST)에서 이번 주를 계산해
 * 서버에 범위를 넘긴다 — 타임존 안전. 테스트 용이.
 */

/** 로컬 시간 기준 YYYY-MM-DD. */
export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** now가 속한 주의 월~일 7일치 날짜(YYYY-MM-DD). */
export function weekDates(now: Date): string[] {
  const monday = new Date(now);
  const dow = (monday.getDay() + 6) % 7; // 일=6, 월=0
  monday.setDate(monday.getDate() - dow);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    out.push(ymd(x));
  }
  return out;
}

export const WEEKDAY_LABEL = ["월", "화", "수", "목", "금", "토", "일"] as const;
