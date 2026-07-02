import { describe, it, expect } from "vitest";
import { ingredientHint, hasLighterOption } from "./substitution";

describe("재료 다이어트 힌트 (재료 대체·직관화)", () => {
  it("고열량 재료엔 가벼운 대체를 제안한다", () => {
    const h = ingredientHint("마요네즈");
    expect(h.swap?.to).toBe("그릭요거트");
    expect(h.optional).toBe(false);
  });

  it("고명·선택 재료는 없어도 되는 것으로 표시한다", () => {
    const h = ingredientHint("통깨");
    expect(h.optional).toBe(true);
    expect(h.swap).toBeNull();
  });

  it("일반 재료엔 힌트가 없다", () => {
    const h = ingredientHint("두부");
    expect(h.optional).toBe(false);
    expect(h.swap).toBeNull();
  });

  it("대체 카피는 부드러운 톤이다(거친 단어 없음)", () => {
    const banned = ["실패", "오류", "경고", "살쪄", "금지"];
    for (const word of banned) {
      const note = ingredientHint("삼겹살").swap?.note ?? "";
      expect(note.includes(word)).toBe(false);
    }
  });

  it("레시피에 가벼운 제안 유무를 판별한다", () => {
    expect(hasLighterOption(["두부", "상추", "마요네즈"])).toBe(true);
    expect(hasLighterOption(["두부", "상추"])).toBe(false);
  });

  it("대분류로 묶어 같은 분류 재료를 폭넓게 커버한다(#1)", () => {
    // 고기류: 개별 등록 없이도 대표 대체로
    expect(ingredientHint("목살").swap?.to).toBe("닭가슴살");
    expect(ingredientHint("차돌박이").swap?.to).toBe("닭가슴살");
    // 당류
    expect(ingredientHint("황설탕").swap?.to).toBe("알룰로스");
    expect(ingredientHint("꿀").swap?.to).toBe("알룰로스");
    // 면류
    expect(ingredientHint("우동면").swap?.to).toBe("곤약면");
  });
});
