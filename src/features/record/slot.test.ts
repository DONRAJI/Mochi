import { describe, it, expect } from "vitest";
import { estimateSlot, SLOT_LABEL } from "./slot";

/** 한국 시각 hour시 — 실행 기기 시간대(로컬 KST · 서버/CI UTC)와 무관하게 같은 순간. */
function at(hour: number): Date {
  return new Date(`2026-09-17T${String(hour).padStart(2, "0")}:00:00+09:00`);
}

describe("끼니 슬롯 자동추정", () => {
  it("한국 시각으로 아침/점심/저녁/간식을 나눈다", () => {
    expect(estimateSlot(at(8))).toBe("breakfast");
    expect(estimateSlot(at(12))).toBe("lunch");
    expect(estimateSlot(at(19))).toBe("dinner");
    expect(estimateSlot(at(2))).toBe("snack");
    expect(estimateSlot(at(23))).toBe("snack");
  });

  it("UTC로 돌아도 한국 점심은 점심, 저녁은 저녁 — 예전엔 간식·아침으로 남았다", () => {
    expect(estimateSlot(new Date("2026-09-17T03:00:00Z"))).toBe("lunch"); // KST 12시
    expect(estimateSlot(new Date("2026-09-17T10:00:00Z"))).toBe("dinner"); // KST 19시
  });

  it("모든 슬롯에 한글 라벨이 있다", () => {
    expect(SLOT_LABEL.breakfast).toBe("아침");
    expect(SLOT_LABEL.lunch).toBe("점심");
    expect(SLOT_LABEL.dinner).toBe("저녁");
    expect(SLOT_LABEL.snack).toBe("간식");
  });
});
