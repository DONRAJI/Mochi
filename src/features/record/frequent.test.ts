import { describe, it, expect } from "vitest";
import { rankFrequentMeals, type FrequentSource } from "./frequent";

const row = (
  mode: string,
  refId: string | null,
  title: string | null,
  eatenAt: string,
): FrequentSource => ({ mode, refId, title, eatenAt });

describe("자주 먹은 것", () => {
  it("많이 먹은 순, 같으면 최근 순", () => {
    const top = rankFrequentMeals([
      row("eatout", null, "아메리카노", "2026-09-10T00:00:00Z"),
      row("eatout", null, "아메리카노", "2026-09-11T00:00:00Z"),
      row("cook", "r1", "김치찌개", "2026-09-12T00:00:00Z"),
      row("convenience", null, "참치김밥", "2026-09-09T00:00:00Z"),
    ]);
    expect(top.map((t) => t.title)).toEqual(["아메리카노", "김치찌개", "참치김밥"]);
    expect(top[0].count).toBe(2);
  });

  it("카탈로그 항목은 refId로, 직접 입력은 이름으로 묶는다 (띄어쓰기·대소문자 무시)", () => {
    const top = rankFrequentMeals([
      row("cook", "r1", "김치찌개", "2026-09-10T00:00:00Z"),
      row("cook", "r1", "김치찌개", "2026-09-11T00:00:00Z"),
      row("eatout", null, "카페 라떼", "2026-09-10T00:00:00Z"),
      row("eatout", null, "카페라떼", "2026-09-12T00:00:00Z"),
    ]);
    expect(top).toHaveLength(2);
    // 둘 다 2번 — 같으면 최근에 먹은 쪽이 먼저. 이름 묶음은 가장 최근 표기로 보여준다.
    expect(top[0]).toMatchObject({ title: "카페라떼", count: 2, refId: null });
    expect(top[1]).toMatchObject({ refId: "r1", count: 2 });
  });

  it("사진만 있는 기록(이름 없음)은 다시 기록할 수 없어 뺀다", () => {
    expect(rankFrequentMeals([row("eatout", null, null, "2026-09-10T00:00:00Z")])).toEqual([]);
  });

  it("개수를 넘으면 상위만", () => {
    const rows = ["a", "b", "c", "d"].map((n) => row("eatout", null, n, "2026-09-10T00:00:00Z"));
    expect(rankFrequentMeals(rows, 3)).toHaveLength(3);
  });
});
