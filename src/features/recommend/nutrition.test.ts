import { describe, it, expect } from "vitest";
import { deriveBadge } from "./nutrition";

describe("deriveBadge", () => {
  it("단백질 비율 높으면 단백질", () => {
    expect(deriveBadge(200, 16)).toBe("💪 단백질"); // 64/200 = 0.32
  });
  it("단백질 비율이 낮으면 뱃지 없음 — 양감은 portion 라벨이 따로 맡는다", () => {
    expect(deriveBadge(180, 12)).toBeNull(); // 48/180 = 0.27 < 0.3
    expect(deriveBadge(600, 16)).toBeNull();
  });
  it("영양 정보를 모르면 뱃지 없음 — 지어내지 않는다(정직화)", () => {
    expect(deriveBadge(null, null)).toBeNull();
    expect(deriveBadge(300, null)).toBeNull();
  });
});
