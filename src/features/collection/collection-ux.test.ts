import { describe, it, expect } from "vitest";
import { progressMessage } from "./progress";
import { flavorText } from "./flavor";

describe("도감 진척 넛지 (PRD 7.3 #2)", () => {
  it("다 모으면 축하", () => {
    expect(progressMessage(14, 14)).toContain("다 모았어요");
  });

  it("아직 없으면 첫 칸 권유", () => {
    expect(progressMessage(0, 36)).toContain("첫 칸");
  });

  it("얼마 안 남으면 '앞으로 N개'", () => {
    expect(progressMessage(30, 36)).toBe("앞으로 6개만 더! 🌸");
  });

  it("많이 남으면 의욕 꺾는 대신 '발견' 프레이밍(레시피 1150 대응)", () => {
    const m = progressMessage(3, 1150);
    expect(m).toContain("3개 발견");
    expect(m).not.toContain("1147"); // "앞으로 1147개" 금지
  });
});

describe("카드 플레이버 (PRD 7.3 #5)", () => {
  it("미획득은 티저", () => {
    expect(flavorText("common", false)).toContain("아직 못 만난");
  });
  it("희귀도별로 다른 코멘트", () => {
    expect(flavorText("epic", true)).not.toBe(flavorText("common", true));
    expect(flavorText("rare", true)).toContain("레어");
  });
});
