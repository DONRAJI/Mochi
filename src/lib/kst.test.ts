import { describe, it, expect } from "vitest";
import { kstDayKey, kstDayNumber, kstDayStart, kstHour, kstMonthRange, kstWeekday } from "./kst";

// 테스트는 시각을 전부 오프셋까지 적는다 — 실행 기기(로컬 KST · CI UTC) 시간대와 무관하게.
const t = (iso: string) => new Date(iso).getTime();

describe("KST 날짜·시각", () => {
  it("UTC로는 전날이어도 한국 아침은 오늘이다", () => {
    // 한국 9월 17일 오전 8시 = UTC 9월 16일 23시
    expect(kstDayKey(t("2026-09-17T08:00:00+09:00"))).toBe("2026-09-17");
    expect(kstHour(t("2026-09-17T08:00:00+09:00"))).toBe(8);
  });

  it("같은 한국 날짜의 아침·밤은 같은 날", () => {
    expect(kstDayNumber(t("2026-09-17T00:10:00+09:00"))).toBe(
      kstDayNumber(t("2026-09-17T23:50:00+09:00")),
    );
    expect(
      kstDayNumber(t("2026-09-18T07:00:00+09:00")) - kstDayNumber(t("2026-09-17T23:00:00+09:00")),
    ).toBe(1);
  });

  it("하루의 시작은 한국 자정", () => {
    expect(kstDayStart(t("2026-09-17T08:00:00+09:00")).toISOString()).toBe(
      "2026-09-16T15:00:00.000Z",
    );
  });

  it("달 범위는 한국 1일 자정부터 다음 달 1일 자정 전까지 (연말 포함)", () => {
    expect(kstMonthRange("2026-09")).toEqual({
      gte: new Date("2026-09-01T00:00:00+09:00"),
      lt: new Date("2026-10-01T00:00:00+09:00"),
    });
    expect(kstMonthRange("2026-12").lt).toEqual(new Date("2027-01-01T00:00:00+09:00"));
  });
  it("요일은 한국 날짜 기준 — UTC로는 토요일 밤이어도 한국은 일요일", () => {
    expect(kstWeekday(t("2026-09-17T12:00:00+09:00"))).toBe(4); // 목
    expect(kstWeekday(t("2026-09-20T01:00:00+09:00"))).toBe(0); // 일 (UTC 19일 토 16시)
  });
});
