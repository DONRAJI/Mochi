import { describe, it, expect } from "vitest";
import { swapFor, hasLighterOption } from "./substitution";

describe("재료 다이어트 힌트 (재료 대체·직관화)", () => {
  it("고열량 재료엔 가벼운 대체를 제안한다", () => {
    expect(swapFor("마요네즈")?.to).toBe("그릭요거트");
  });

  it("일반 재료엔 대체 힌트가 없다", () => {
    expect(swapFor("두부")).toBeNull();
    // 흔한 양념·고명(후추·통깨)도 이제 발화 대상이 아님 — '없어도 돼요'는 희귀 재료만 (practicality)
    expect(swapFor("통깨")).toBeNull();
    expect(swapFor("후추")).toBeNull();
  });

  it("대체 카피는 부드러운 톤이다(거친 단어 없음)", () => {
    const banned = ["실패", "오류", "경고", "살쪄", "금지"];
    for (const word of banned) {
      const note = swapFor("삼겹살")?.note ?? "";
      expect(note.includes(word)).toBe(false);
    }
  });

  it("레시피에 가벼운 대체 유무를 판별한다", () => {
    expect(hasLighterOption(["두부", "상추", "마요네즈"])).toBe(true);
    expect(hasLighterOption(["두부", "상추"])).toBe(false);
  });

  it("대분류로 묶어 같은 분류 재료를 폭넓게 커버한다(#1)", () => {
    // 고기류: 개별 등록 없이도 대표 대체로
    expect(swapFor("목살")?.to).toBe("닭가슴살");
    expect(swapFor("차돌박이")?.to).toBe("닭가슴살");
    // 당류
    expect(swapFor("황설탕")?.to).toBe("알룰로스");
    expect(swapFor("꿀")?.to).toBe("알룰로스");
    // 면류
    expect(swapFor("우동면")?.to).toBe("곤약면");
  });
});
