import { describe, it, expect } from "vitest";
import { discoveryCheckFor } from "./discovery";
import { mealSeeds, DRAW_COST } from "./gacha";

describe("첫 발견 판단", () => {
  it("레시피·편의점 카탈로그는 기존대로 도감 기준", () => {
    expect(discoveryCheckFor({ mode: "cook", refId: "cookrcp-1" })).toEqual({ kind: "catalog" });
    expect(discoveryCheckFor({ mode: "convenience", refId: "conv-1" })).toEqual({
      kind: "catalog",
    });
  });

  it("외식 메뉴는 같은 메뉴 기록 여부로", () => {
    expect(discoveryCheckFor({ mode: "eatout", refId: "menu-1" })).toEqual({
      kind: "menu",
      refId: "menu-1",
    });
  });

  it("음식 사전·직접 입력은 이름으로 — 밖에서 먹는 사람도 첫 발견을 받는다", () => {
    expect(discoveryCheckFor({ mode: "eatout", name: " 아메리카노 " })).toEqual({
      kind: "name",
      name: "아메리카노",
    });
  });

  it("사진만 올린 기록은 무엇인지 모르니 첫 발견 없음", () => {
    expect(discoveryCheckFor({ mode: "eatout" })).toBeNull();
    expect(discoveryCheckFor({ mode: "eatout", name: "  " })).toBeNull();
  });

  it("밖에서 먹는 사람도 첫날 두 끼(새 음식)로 첫 뽑기가 된다", () => {
    const first = mealSeeds({
      firstMealForSlot: true,
      firstDiscovery: true,
      streakAdvanced: true,
      streakCount: 1,
    });
    const second = mealSeeds({
      firstMealForSlot: true,
      firstDiscovery: true,
      streakAdvanced: false,
      streakCount: 1,
    });
    expect(first + second).toBeGreaterThanOrEqual(DRAW_COST);
  });
});
