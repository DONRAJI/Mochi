import { describe, it, expect } from "vitest";
import { deriveBadge } from "./nutrition";

describe("deriveBadge", () => {
  it("단백질 비율 높으면 단백질", () => {
    expect(deriveBadge(200, 16)).toBe("💪 단백질"); // 64/200 = 0.32
  });
  it("저칼로리는 가벼움", () => {
    expect(deriveBadge(180, 12)).toBe("🍃 가벼움"); // 48/180 = 0.27 < 0.3, kcal<=350
  });
  it("고칼로리는 포만감", () => {
    expect(deriveBadge(600, 16)).toBe("🫧 포만감"); // 64/600 = 0.1, kcal>350
  });
  it("영양 정보를 아예 모르면 뱃지 없음 — 지어내지 않는다(정직화)", () => {
    expect(deriveBadge(null, null)).toBeNull();
  });
  it("kcal만 알아도 그 근거로는 뱃지를 준다", () => {
    expect(deriveBadge(300, null)).toBe("🍃 가벼움");
    expect(deriveBadge(600, null)).toBe("🫧 포만감");
  });
});
