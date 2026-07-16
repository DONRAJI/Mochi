import { describe, it, expect } from "vitest";
import {
  buildMealHistory,
  availableMonths,
  kstDayKey,
  type HistoryMeal,
  type HistoryWeight,
} from "./history";

function meal(over: Partial<HistoryMeal> & { eatenAt: string }): HistoryMeal {
  return {
    id: over.id ?? over.eatenAt,
    slot: over.slot ?? "dinner",
    mode: over.mode ?? "cook",
    title: over.title ?? null,
    kcal: over.kcal ?? null,
    photoUrl: over.photoUrl ?? null,
    eatenAt: over.eatenAt,
  };
}

describe("history — KST 날짜 키", () => {
  it("UTC 자정 근처를 한국 하루로 정확히 자른다", () => {
    // 2026-07-09T16:00Z = 2026-07-10 01:00 KST
    expect(kstDayKey("2026-07-09T16:00:00.000Z")).toBe("2026-07-10");
    // 2026-07-09T14:59Z = 2026-07-09 23:59 KST
    expect(kstDayKey("2026-07-09T14:59:00.000Z")).toBe("2026-07-09");
  });
});

describe("history — 날짜별 회고 묶음", () => {
  it("최근 날짜 먼저, 같은 날 끼니는 이른 시간 순", () => {
    const meals = [
      meal({ id: "a", eatenAt: "2026-07-08T09:00:00+09:00", title: "토스트", slot: "breakfast" }),
      meal({ id: "b", eatenAt: "2026-07-08T19:00:00+09:00", title: "제육볶음", slot: "dinner" }),
      meal({ id: "c", eatenAt: "2026-07-09T12:00:00+09:00", title: "김밥", slot: "lunch" }),
    ];
    const days = buildMealHistory(meals, []);
    expect(days.map((d) => d.date)).toEqual(["2026-07-09", "2026-07-08"]);
    expect(days[1].meals.map((m) => m.title)).toEqual(["토스트", "제육볶음"]); // 이른 시간 순
  });

  it("그날 체중은 마지막 기록, 직전 기록일 대비 변화(delta)를 준다", () => {
    const weights: HistoryWeight[] = [
      { weight: 60, loggedAt: "2026-07-07T08:00:00+09:00" },
      { weight: 59.5, loggedAt: "2026-07-09T08:00:00+09:00" },
      { weight: 59.8, loggedAt: "2026-07-09T22:00:00+09:00" }, // 같은 날 더 늦은 기록 → 이게 그날 체중
    ];
    const days = buildMealHistory([], weights);
    const d9 = days.find((d) => d.date === "2026-07-09")!;
    const d7 = days.find((d) => d.date === "2026-07-07")!;
    expect(d9.weight).toBe(59.8);
    expect(d9.weightDelta).toBe(-0.2); // 59.8 - 60 (직전 기록일 7/7)
    expect(d7.weightDelta).toBeNull(); // 첫 기록일
  });

  it("체중만 있고 식사가 없는 날도 나온다", () => {
    const days = buildMealHistory([], [{ weight: 60, loggedAt: "2026-07-05T08:00:00+09:00" }]);
    expect(days).toHaveLength(1);
    expect(days[0].meals).toEqual([]);
    expect(days[0].weight).toBe(60);
  });

  it("totalKcal — kcal 있는 끼니 합계, 전부 없으면 null(cozy 모드)", () => {
    const withKcal = buildMealHistory(
      [
        meal({ eatenAt: "2026-07-09T12:00:00+09:00", kcal: 500 }),
        meal({ eatenAt: "2026-07-09T19:00:00+09:00", kcal: 300 }),
      ],
      [],
    );
    expect(withKcal[0].totalKcal).toBe(800);

    const noKcal = buildMealHistory([meal({ eatenAt: "2026-07-09T12:00:00+09:00" })], []);
    expect(noKcal[0].totalKcal).toBeNull();
  });

  it("title 없으면(사진만 등) null로 두고, 라벨에 요일을 붙인다", () => {
    const days = buildMealHistory([meal({ eatenAt: "2026-07-09T12:00:00+09:00", title: null })], []);
    expect(days[0].meals[0].title).toBeNull();
    expect(days[0].label).toContain("월"); // "7월 9일 (수)" 형태
  });
});

describe("history — 월 목록(availableMonths)", () => {
  it("기록 있는 달만 최근 먼저, 중복 없이", () => {
    const days = buildMealHistory(
      [
        meal({ eatenAt: "2026-07-09T12:00:00+09:00" }),
        meal({ eatenAt: "2026-07-02T12:00:00+09:00" }), // 같은 달 → 한 번만
        meal({ eatenAt: "2026-06-20T12:00:00+09:00" }),
        meal({ eatenAt: "2025-12-31T12:00:00+09:00" }),
      ],
      [],
    );
    expect(availableMonths(days)).toEqual(["2026-07", "2026-06", "2025-12"]);
  });

  it("기록이 없으면 빈 배열", () => {
    expect(availableMonths([])).toEqual([]);
  });
});
