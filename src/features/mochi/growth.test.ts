import { describe, it, expect } from "vitest";
import {
  GROWTH_THRESHOLDS,
  MAX_GROWTH_STAGE,
  growthStageFor,
  growthTitle,
  nextGrowthIn,
  growthMessage,
} from "./growth";

describe("모찌 성장 (누적 기록 기반)", () => {
  it("첫 기록 전에도 1단계 — 0단계로 시작해 초라하게 두지 않는다", () => {
    expect(growthStageFor(0)).toBe(1);
    expect(growthTitle(1)).toBe("새싹 모찌");
  });

  it("문턱을 넘을 때마다 한 단계씩 오른다", () => {
    expect(growthStageFor(2)).toBe(1);
    expect(growthStageFor(3)).toBe(2);
    expect(growthStageFor(6)).toBe(2);
    expect(growthStageFor(7)).toBe(3);
    expect(growthStageFor(13)).toBe(3);
    expect(growthStageFor(14)).toBe(4);
    expect(growthStageFor(29)).toBe(4);
    expect(growthStageFor(30)).toBe(5);
  });

  it("마지막 단계를 넘겨도 단계가 넘치지 않는다", () => {
    expect(growthStageFor(9999)).toBe(MAX_GROWTH_STAGE);
    expect(growthTitle(99)).toBe("반짝반짝 모찌");
  });

  it("다음 단계까지 남은 수를 알려주고, 마지막이면 null", () => {
    expect(nextGrowthIn(0)).toBe(3);
    expect(nextGrowthIn(2)).toBe(1);
    expect(nextGrowthIn(3)).toBe(4); // 다음 문턱 7까지
    expect(nextGrowthIn(29)).toBe(1);
    expect(nextGrowthIn(30)).toBeNull();
  });

  it("문턱은 오름차순이고 0에서 시작한다 (단계 계산 전제)", () => {
    expect(GROWTH_THRESHOLDS[0]).toBe(0);
    const sorted = [...GROWTH_THRESHOLDS].sort((a, b) => a - b);
    expect([...GROWTH_THRESHOLDS]).toEqual(sorted);
  });

  it("성장은 되돌아가지 않는다 — 기록이 늘수록 단계는 단조 증가", () => {
    let prev = 0;
    for (let n = 0; n <= 40; n++) {
      const s = growthStageFor(n);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  it("안내 문구는 도착지를 알려주되 지적하지 않는다 (불변 #1)", () => {
    expect(growthMessage(0)).toBe("한 끼 기록하면 모찌가 자라기 시작해요");
    expect(growthMessage(2)).toBe("1번 더 기록하면 모찌가 자라요");
    expect(growthMessage(30)).toContain("한껏 자랐어요");
    for (const n of [0, 2, 5, 14, 30]) {
      expect(growthMessage(n)).not.toMatch(/실패|해야|못|부족|아직도/);
    }
  });
});
