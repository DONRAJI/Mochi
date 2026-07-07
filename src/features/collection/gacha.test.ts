import { describe, it, expect } from "vitest";
import {
  mealSeeds,
  rollRarity,
  isPityReady,
  nextPity,
  pickIndex,
  cappedSeedGrant,
  DRAW_COST,
} from "./gacha";

describe("모찌 뽑기 경제", () => {
  it("뽑기 비용은 씨앗 5", () => {
    expect(DRAW_COST).toBe(5);
  });

  it("씨앗: 기록 +1", () => {
    expect(mealSeeds({ firstDiscovery: false, streakAdvanced: false, streakCount: 3 })).toBe(1);
  });
  it("씨앗: 첫 발견 +1", () => {
    expect(mealSeeds({ firstDiscovery: true, streakAdvanced: false, streakCount: 3 })).toBe(2);
  });
  it("씨앗: 스트릭 이어감 +1, 7일 마일스톤 +3", () => {
    expect(mealSeeds({ firstDiscovery: false, streakAdvanced: true, streakCount: 3 })).toBe(2);
    expect(mealSeeds({ firstDiscovery: true, streakAdvanced: true, streakCount: 7 })).toBe(1 + 1 + 1 + 3);
  });

  it("일일 상한 — 등록/취소 farming 방지", () => {
    expect(cappedSeedGrant(2, 0, 10)).toBe(2); // 여유 있음
    expect(cappedSeedGrant(2, 9, 10)).toBe(1); // 1개만 남음
    expect(cappedSeedGrant(2, 10, 10)).toBe(0); // 상한 도달 → 더는 없음
    expect(cappedSeedGrant(5, 8, 10)).toBe(2); // 남은 만큼만
  });
});

describe("등급 확률", () => {
  it("가중 확률 구간 (common50/rare30/epic15/legendary5)", () => {
    expect(rollRarity(0.0, false)).toBe("common");
    expect(rollRarity(0.49, false)).toBe("common");
    expect(rollRarity(0.5, false)).toBe("rare");
    expect(rollRarity(0.79, false)).toBe("rare");
    expect(rollRarity(0.85, false)).toBe("epic");
    expect(rollRarity(0.9, false)).toBe("epic");
    expect(rollRarity(0.96, false)).toBe("legendary");
    expect(rollRarity(0.999, false)).toBe("legendary");
  });

  it("보장 상태면 epic 이상만", () => {
    expect(rollRarity(0.0, true)).toBe("epic");
    expect(rollRarity(0.74, true)).toBe("epic");
    expect(rollRarity(0.75, true)).toBe("legendary");
  });
});

describe("보장(pity) 카운터", () => {
  it("9번 허탕이면 10번째 보장", () => {
    expect(isPityReady(8)).toBe(false);
    expect(isPityReady(9)).toBe(true);
  });
  it("epic↑는 리셋, 그 외는 +1", () => {
    expect(nextPity(5, "common")).toBe(6);
    expect(nextPity(5, "rare")).toBe(6);
    expect(nextPity(9, "epic")).toBe(0);
    expect(nextPity(9, "legendary")).toBe(0);
  });
});

describe("카드 인덱스", () => {
  it("범위 안 인덱스", () => {
    expect(pickIndex(4, 0)).toBe(0);
    expect(pickIndex(4, 0.99)).toBe(3);
    expect(pickIndex(4, 1)).toBe(3); // clamp
  });
});
