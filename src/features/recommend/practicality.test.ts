import { describe, it, expect } from "vitest";
import { countUltraRare, isPractical, isSkippableRare } from "./practicality";

/** freq 헬퍼 — [재료, 등장수] 쌍으로 맵 생성. 없는 재료는 0회(초희귀). */
const freqOf = (pairs: [string, number][]) => new Map(pairs);

describe("practicality — 실용성 하드 컷", () => {
  const freq = freqOf([
    ["두부", 100],
    ["계란", 200],
    ["마늘", 150],
    ["북어채", 2], // 초희귀
    ["백년초가루", 1], // 초희귀
    ["석류즙", 6], // 희귀지만 초희귀는 아님
  ]);

  it("초희귀 재료 2개 이상이면 비실전 (사과 새우 북엇국 케이스)", () => {
    expect(isPractical(["두부", "북어채", "백년초가루"], freq)).toBe(false);
  });

  it("초희귀 1개 + 재료 10개 이상이면 비실전 (인삼갈비탕 케이스)", () => {
    const names = ["북어채", "두부", "계란", "마늘", "a", "b", "c", "d", "e", "f"];
    // a~f는 freq에 없음 → 0회 = 초희귀로 집계되므로, 흔한 재료로 채워 재검
    const common = freqOf([...names.map((n) => [n, 50] as [string, number]), ["북어채", 2]]);
    expect(countUltraRare(names, common)).toBe(1);
    expect(isPractical(names, common)).toBe(false);
  });

  it("초희귀 1개라도 재료가 적으면(<10) 실전으로 유지", () => {
    expect(isPractical(["두부", "계란", "북어채"], freq)).toBe(true);
  });

  it("초희귀 0개 + 재료 15개 미만이면 실전", () => {
    expect(isPractical(["두부", "계란", "마늘"], freq)).toBe(true);
  });

  it("재료 15개 이상이면 초희귀 없어도 비실전 (정식/행사 요리)", () => {
    const names = Array.from({ length: 15 }, (_, i) => `재료${i}`);
    const common = freqOf(names.map((n) => [n, 50] as [string, number]));
    expect(isPractical(names, common)).toBe(false);
  });
});

describe("practicality — 잘 안 쓰는 재료 힌트", () => {
  const freq = freqOf([
    ["후추", 300],
    ["백년초가루", 1],
    ["돌나물", 3],
  ]);

  it("희귀(≤5회) 재료만 힌트 대상 — 흔한 양념은 말하지 않는다", () => {
    expect(isSkippableRare("백년초가루", freq, "수수부꾸미")).toBe(true);
    expect(isSkippableRare("후추", freq, "수수부꾸미")).toBe(false);
  });

  it("요리 이름의 주인공 재료는 빼라고 하지 않는다", () => {
    expect(isSkippableRare("돌나물", freq, "돌나물 샐러드")).toBe(false);
    expect(isSkippableRare("돌나물", freq, "두부무침")).toBe(true);
  });
});
