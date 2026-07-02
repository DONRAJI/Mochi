import { describe, it, expect } from "vitest";
import { weekDates, ymd } from "./week";

describe("주간 캘린더 날짜 유틸", () => {
  it("YYYY-MM-DD 포맷", () => {
    expect(ymd(new Date(2026, 6, 2))).toBe("2026-07-02"); // 월=6(0-index)
  });

  it("주는 월요일에서 시작해 7일", () => {
    // 2026-07-02는 목요일 → 그 주 월요일은 2026-06-29
    const w = weekDates(new Date(2026, 6, 2));
    expect(w).toHaveLength(7);
    expect(w[0]).toBe("2026-06-29"); // 월
    expect(w[6]).toBe("2026-07-05"); // 일
  });

  it("일요일도 같은 주(월~일)로 묶인다", () => {
    // 2026-07-05는 일요일 → 월요일은 여전히 2026-06-29
    expect(weekDates(new Date(2026, 6, 5))[0]).toBe("2026-06-29");
  });
});
