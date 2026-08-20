import { describe, it, expect } from "vitest";
import { servingsLabel, kcalLabel } from "./mealMeta";

describe("레시피 메타 표기", () => {
  it("여러 인분이면 '분량'임을 밝힌다", () => {
    expect(servingsLabel(30, 4)).toBe("⏱ 30분 · 4인분 분량");
  });

  it("1인분이면 분량 표기를 생략한다 — '1인분 분량'은 어색하다", () => {
    expect(servingsLabel(15, 1)).toBe("⏱ 15분");
    expect(servingsLabel(15, null)).toBe("⏱ 15분");
  });

  it("조리시간이 없으면(외식·간편식) 메타 줄을 만들지 않는다", () => {
    expect(servingsLabel(null, 2)).toBeNull();
  });

  it("칼로리는 몇 인분이든 1인분 기준임을 못박는다", () => {
    // 예전엔 "4인분 · 70kcal"이라 한 그릇인지 냄비 전체인지 알 수 없었다.
    expect(kcalLabel(70)).toBe("1인분 70kcal");
    expect(kcalLabel(null)).toBeNull(); // cozy 모드는 값이 아예 안 온다(#4)
  });
});
