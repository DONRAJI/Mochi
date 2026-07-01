import { describe, it, expect } from "vitest";
import { estimateSlot, SLOT_LABEL } from "./slot";

/** 시간대 → 끼니 슬롯 자동추정 (PRD 11.2). 로컬 시간 기준으로 만든다. */
function at(hour: number): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
}

describe("끼니 슬롯 자동추정", () => {
  it("아침/점심/저녁/간식 시간대를 나눈다", () => {
    expect(estimateSlot(at(8))).toBe("breakfast");
    expect(estimateSlot(at(12))).toBe("lunch");
    expect(estimateSlot(at(19))).toBe("dinner");
    expect(estimateSlot(at(2))).toBe("snack");
    expect(estimateSlot(at(23))).toBe("snack");
  });

  it("모든 슬롯에 한글 라벨이 있다", () => {
    expect(SLOT_LABEL.breakfast).toBe("아침");
    expect(SLOT_LABEL.lunch).toBe("점심");
    expect(SLOT_LABEL.dinner).toBe("저녁");
    expect(SLOT_LABEL.snack).toBe("간식");
  });
});
