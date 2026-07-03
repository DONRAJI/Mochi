import { describe, it, expect } from "vitest";
import { availableYears, groupByMonth, groupByWeek } from "./weightStats";
import type { WeightLogResponse } from "./types";

/** 로컬 자정 기준 ISO — 테스트를 시간대에 안정적으로. */
function pt(dateStr: string, weight: number): WeightLogResponse {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { id: dateStr, weight, loggedAt: new Date(y, m - 1, d, 12, 0, 0).toISOString() };
}

describe("체중 집계", () => {
  const sample: WeightLogResponse[] = [
    pt("2024-07-01", 59),
    pt("2024-07-15", 58),
    pt("2024-08-01", 57.5),
    pt("2024-08-20", 57),
    pt("2025-01-05", 56),
  ];

  it("기록 있는 연도를 최근 먼저 나열", () => {
    expect(availableYears(sample)).toEqual([2025, 2024]);
  });

  it("월별 평균·기록수 집계", () => {
    const months = groupByMonth(sample, 2024);
    expect(months.map((m) => m.label)).toEqual(["7월", "8월"]);
    expect(months[0].avg).toBe(58.5); // (59+58)/2
    expect(months[0].count).toBe(2);
    expect(months[1].avg).toBe(57.3); // (57.5+57)/2=57.25 → 57.3
  });

  it("추세: 첫 달은 flat, 줄면 down", () => {
    const months = groupByMonth(sample, 2024);
    expect(months[0].trend).toBe("flat");
    expect(months[1].trend).toBe("down"); // 58.5 → 57.3
  });

  it("다른 연도는 섞이지 않는다", () => {
    expect(groupByMonth(sample, 2025).map((m) => m.label)).toEqual(["1월"]);
  });

  it("주간 집계 — 같은 주는 한 버킷", () => {
    const week = [pt("2024-07-01", 60), pt("2024-07-03", 58)]; // 둘 다 같은 주(월 7/1)
    const weeks = groupByWeek(week);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].avg).toBe(59);
  });

  it("주간 limit — 최근 N주만", () => {
    const many: WeightLogResponse[] = [];
    for (let w = 0; w < 20; w++) many.push(pt(`2024-01-${String(1 + w * 7).padStart(2, "0")}`, 60));
    // 1월은 최대 ~5주라 20개는 못 채우지만 limit 동작만 확인
    expect(groupByWeek(many, 3).length).toBeLessThanOrEqual(3);
  });
});
