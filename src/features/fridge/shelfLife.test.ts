import { describe, it, expect } from "vitest";
import { estimateExpiry, fridgeCategoryOf, shelfLifeDays } from "./shelfLife";

describe("재료 보관 기간 추정", () => {
  it("흔한 재료는 이름별, 나머지는 분류 기본값", () => {
    expect(shelfLifeDays("두부", "단백질")).toBe(5);
    expect(shelfLifeDays("계란", "단백질")).toBe(21);
    expect(shelfLifeDays("돼지고기", "단백질")).toBe(3);
    expect(shelfLifeDays("애호박", "채소")).toBe(7);
  });

  it("오래 두는 재료·양념은 추정하지 않는다", () => {
    expect(shelfLifeDays("쌀", "곡물")).toBeNull();
    expect(shelfLifeDays("간장", "기타")).toBeNull();
    expect(shelfLifeDays("참치", "단백질")).toBeNull(); // 통조림
  });

  it("담은 순간부터 계산", () => {
    const from = new Date("2026-09-17T10:00:00+09:00");
    expect(estimateExpiry("두부", "단백질", from)?.toISOString()).toBe(
      new Date("2026-09-22T10:00:00+09:00").toISOString(),
    );
    expect(estimateExpiry("쌀", "곡물", from)).toBeNull();
  });
});

describe("냉동 보관", () => {
  it("냉동이면 대략 3개월 — 냉동새우가 생새우 2일로 잡히지 않게", () => {
    expect(shelfLifeDays("새우", "단백질", "freezer")).toBe(90);
    expect(shelfLifeDays("새우", "단백질", "fridge")).toBe(2);
    expect(shelfLifeDays("빵", "곡물", "freezer")).toBe(30);
  });

  it("냉장에선 추정 안 하던 것도 냉동이면 기간을 둔다", () => {
    expect(shelfLifeDays("만두", "기타")).toBeNull();
    expect(shelfLifeDays("만두", "기타", "freezer")).toBe(90);
  });
});

describe("재료 마스터 분류 → 냉장고 탭", () => {
  it("탭에 있는 분류는 그대로, 가공육·가공수산은 단백질, 나머지는 기타", () => {
    expect(fridgeCategoryOf("채소")).toBe("채소");
    expect(fridgeCategoryOf("가공육")).toBe("단백질");
    expect(fridgeCategoryOf("양념")).toBe("기타");
    expect(fridgeCategoryOf(null)).toBe("기타");
  });
});
