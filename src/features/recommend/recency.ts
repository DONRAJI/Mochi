/**
 * 최근에 먹은 건 아래로 — 추천의 다양성 신호 (순수 함수).
 *
 * 왜: 추천이 냉장고 매칭률·취향·현실성만 보다 보니, 어제 먹은 요리가 오늘도 맨 위에
 * 그대로 뜬다. "오늘 뭐 먹지"를 풀어주는 앱인데 같은 답을 반복하면 결정을 대신해준 게
 * 아니다. 제외가 아니라 **하향**이다 — 정말 자주 먹는 메뉴는 여전히 떠야 한다.
 */

/** 이 기간을 넘기면 감점 없음. 일주일이면 다시 먹어도 자연스럽다. */
export const RECENCY_WINDOW_DAYS = 7;

/** 오늘 먹은 것의 최대 감점. 매칭률(0~100) 대비 '확실히 밀리되 사라지지는 않는' 크기. */
export const MAX_RECENCY_PENALTY = 40;

/**
 * 마지막으로 먹은 뒤 지난 일수 → 감점(0 이상). 안 먹었으면 0.
 * 하루가 지날수록 선형으로 풀린다: 0일 40 · 3일 23 · 6일 6 · 7일 이상 0.
 */
export function recencyPenalty(daysSinceEaten: number | null): number {
  if (daysSinceEaten === null || daysSinceEaten >= RECENCY_WINDOW_DAYS) return 0;
  const d = Math.max(0, daysSinceEaten);
  return Math.round(MAX_RECENCY_PENALTY * (1 - d / RECENCY_WINDOW_DAYS));
}

/**
 * 두 시각 사이의 '지난 일수'를 KST 날짜 경계로 센다.
 * 시간 차(24시간)로 세면 어젯밤 11시에 먹은 게 오늘 아침엔 아직 0일이 돼
 * "어제 먹었는데 오늘도 1등"이 그대로 남는다. 달력 기준이 사용자 감각과 맞다.
 */
export function daysBetweenKst(eatenAtMs: number, nowMs: number): number {
  const KST = 9 * 3_600_000;
  const day = (ms: number) => Math.floor((ms + KST) / 86_400_000);
  return Math.max(0, day(nowMs) - day(eatenAtMs));
}

/** 마지막 섭취 시각(없으면 null) → 감점. 서비스가 쓰는 진입점. */
export function penaltyForLastEaten(lastEatenMs: number | null, nowMs = Date.now()): number {
  if (lastEatenMs === null) return 0;
  return recencyPenalty(daysBetweenKst(lastEatenMs, nowMs));
}
