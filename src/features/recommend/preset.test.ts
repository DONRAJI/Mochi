import { describe, it, expect } from "vitest";
import { weekdayOf, slotKey, planPresetApply, type PresetItemResponse } from "./preset";

const item = (weekday: number, slot: PresetItemResponse["slot"], title: string): PresetItemResponse => ({
  weekday, slot, mode: "cook", refId: null, title, emoji: null,
});
// 2026-08-17(월) ~ 08-23(일)
const WEEK = ["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23"];

describe("요일 계산", () => {
  it("월=0 … 일=6 (week.ts와 같은 기준)", () => {
    expect(weekdayOf("2026-08-17")).toBe(0); // 월
    expect(weekdayOf("2026-08-20")).toBe(3); // 목
    expect(weekdayOf("2026-08-23")).toBe(6); // 일
  });

  it("UTC 파싱으로 요일이 밀리지 않는다", () => {
    // new Date("2026-08-17")는 UTC 자정 → KST에선 전날(일요일)로 읽힌다.
    // 문자열을 쪼개 로컬로 만들어야 월요일(0)이 나온다.
    expect(weekdayOf("2026-08-17")).not.toBe(6);
  });
});

describe("프리셋 적용", () => {
  it("빈 주에는 프리셋 항목이 모두 들어간다", () => {
    const items = [item(0, "dinner", "두부김치"), item(2, "lunch", "비빔밥")];
    const { toCreate, skipped } = planPresetApply(WEEK, items, new Set());
    expect(skipped).toBe(0);
    expect(toCreate.map((c) => [c.date, c.title])).toEqual([
      ["2026-08-17", "두부김치"],
      ["2026-08-19", "비빔밥"],
    ]);
  });

  it("이미 찬 칸은 덮어쓰지 않고 건너뛴다 — 짜둔 계획을 지우지 않는다", () => {
    const items = [item(0, "dinner", "두부김치"), item(1, "dinner", "김치찌개")];
    const occupied = new Set([slotKey(0, "dinner")]);
    const { toCreate, skipped } = planPresetApply(WEEK, items, occupied);
    expect(skipped).toBe(1);
    expect(toCreate).toHaveLength(1);
    expect(toCreate[0].title).toBe("김치찌개");
  });

  it("프리셋 안에서 같은 칸이 겹쳐도 하나만 만든다", () => {
    const items = [item(0, "dinner", "A"), item(0, "dinner", "B")];
    const { toCreate, skipped } = planPresetApply(WEEK, items, new Set());
    expect(toCreate).toHaveLength(1);
    expect(skipped).toBe(1);
  });

  it("끼니가 없는 항목도 같은 칸으로 취급한다", () => {
    const items = [item(0, null, "A"), item(0, null, "B")];
    const { toCreate } = planPresetApply(WEEK, items, new Set());
    expect(toCreate).toHaveLength(1);
  });

  it("적용 범위에 없는 요일은 조용히 제외된다 (부분 주)", () => {
    const items = [item(0, "dinner", "월요일것"), item(6, "dinner", "일요일것")];
    const { toCreate, skipped } = planPresetApply(WEEK.slice(0, 2), items, new Set());
    expect(toCreate).toHaveLength(1);
    expect(toCreate[0].title).toBe("월요일것");
    expect(skipped).toBe(0); // 건너뛴 게 아니라 범위 밖
  });
});
