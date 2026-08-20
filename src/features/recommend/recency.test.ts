import { describe, it, expect } from "vitest";
import {
  recencyPenalty,
  daysBetweenKst,
  penaltyForLastEaten,
  RECENCY_WINDOW_DAYS,
  MAX_RECENCY_PENALTY,
} from "./recency";

const DAY = 86_400_000;
/** KST 정오 기준으로 고정 — 자정 근처 경계 흔들림 없이 테스트하려고. */
const noonKst = (dayOffset: number) => Date.UTC(2026, 7, 20, 3, 0, 0) + dayOffset * DAY;

describe("최근 섭취 감점", () => {
  it("안 먹었으면 감점 없음", () => {
    expect(recencyPenalty(null)).toBe(0);
    expect(penaltyForLastEaten(null)).toBe(0);
  });

  it("오늘 먹었으면 최대 감점, 하루씩 지날수록 풀린다", () => {
    expect(recencyPenalty(0)).toBe(MAX_RECENCY_PENALTY);
    expect(recencyPenalty(3)).toBe(23);
    expect(recencyPenalty(6)).toBe(6);
  });

  it("기간을 넘기면 감점이 사라진다 — 일주일이면 다시 먹어도 자연스럽다", () => {
    expect(recencyPenalty(RECENCY_WINDOW_DAYS)).toBe(0);
    expect(recencyPenalty(30)).toBe(0);
  });

  it("감점은 단조 감소하고 매칭률(100)을 넘지 않는다 — 제외가 아니라 하향", () => {
    let prev = Infinity;
    for (let d = 0; d <= RECENCY_WINDOW_DAYS; d++) {
      const p = recencyPenalty(d);
      expect(p).toBeLessThanOrEqual(prev);
      expect(p).toBeLessThan(100);
      prev = p;
    }
  });

  it("지난 일수는 시간 차가 아니라 KST 달력 경계로 센다", () => {
    // 어젯밤 23시(KST)에 먹고 오늘 아침 8시 → 9시간 차이지만 '어제'로 세야 한다.
    const lastNight = Date.UTC(2026, 7, 19, 14, 0, 0); // KST 8/19 23:00
    const thisMorning = Date.UTC(2026, 7, 19, 23, 0, 0); // KST 8/20 08:00
    expect(daysBetweenKst(lastNight, thisMorning)).toBe(1);
  });

  it("같은 날 안이면 0일", () => {
    expect(daysBetweenKst(noonKst(0), noonKst(0) + 3 * 3_600_000)).toBe(0);
  });

  it("미래 시각이 들어와도 음수가 되지 않는다", () => {
    expect(daysBetweenKst(noonKst(1), noonKst(0))).toBe(0);
  });
});
