import { describe, it, expect } from "vitest";
import { upcomingDates } from "./plan";

describe("자동 채우기 대상 날짜", () => {
  const week = [
    "2026-09-14",
    "2026-09-15",
    "2026-09-16",
    "2026-09-17",
    "2026-09-18",
    "2026-09-19",
    "2026-09-20",
  ];

  it("수요일에 누르면 월·화는 빼고 오늘부터", () => {
    expect(upcomingDates(week, "2026-09-16")).toEqual(week.slice(2));
  });

  it("주가 다 지났으면 채울 날이 없다", () => {
    expect(upcomingDates(week, "2026-09-21")).toEqual([]);
  });
});
