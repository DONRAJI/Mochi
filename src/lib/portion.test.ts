import { describe, it, expect } from "vitest";
import { portionOf, PORTION_LABEL } from "./portion";

describe("한 끼 양감 라벨", () => {
  it("1인분 kcal로 세 단계 (경계 포함)", () => {
    expect(portionOf(11)).toBe("light"); // 아메리카노
    expect(portionOf(350)).toBe("light");
    expect(portionOf(351)).toBe("hearty");
    expect(portionOf(639)).toBe("hearty"); // 비빔밥
    expect(portionOf(700)).toBe("hearty");
    expect(portionOf(909)).toBe("full"); // 삼계탕
  });

  it("칼로리를 모르면 라벨도 없다", () => {
    expect(portionOf(null)).toBeNull();
    expect(portionOf(undefined)).toBeNull();
    expect(portionOf(Number.NaN)).toBeNull();
  });

  it("라벨에 숫자·지적하는 말이 없다 (불변 #1·#2)", () => {
    for (const label of Object.values(PORTION_LABEL)) {
      expect(label).not.toMatch(/\d|과다|초과|주의|많이/);
    }
  });
});
