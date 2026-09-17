import { describe, it, expect } from "vitest";
import { isWeightStale, WEIGHT_STALE_DAYS } from "./weightFreshness";

const t = (iso: string) => new Date(iso).getTime();

describe("체중 기록 신선도", () => {
  it(`${WEIGHT_STALE_DAYS}일(한국 날짜) 이상 지나면 오래된 기록`, () => {
    const now = t("2026-09-17T09:00:00+09:00");
    expect(isWeightStale(t("2026-09-04T23:00:00+09:00"), now)).toBe(false); // 13일
    expect(isWeightStale(t("2026-09-03T08:00:00+09:00"), now)).toBe(true); // 14일
  });

  it("기록이 없으면 권하지 않는다 — 예산도 없다", () => {
    expect(isWeightStale(null)).toBe(false);
  });
});
