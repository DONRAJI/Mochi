/**
 * 식사·체중 회고 (순수 함수, PRD 6장 회고 흐름) — 먹은 것과 체중을 날짜별로 묶는다.
 *
 * "이 날 뭘 먹었지 → 다음날 체중 보니…"를 사용자가 스스로 돌아보게 한다.
 * 죄책감 제로(불변 #1): 데이터를 정직하게 나란히 놓을 뿐, 벌하거나 단정하지 않는다(추세는 부호만).
 * 숫자(체중·kcal)는 마이 트리에서만(불변 #2) — 이 화면은 마이 전용.
 */
import type { MealHistoryDayResponse, MealSlot } from "./types";

export interface HistoryMeal {
  id: string;
  slot: MealSlot | null;
  mode: "cook" | "eatout" | "convenience";
  title: string | null; // refId 해석된 이름 (사진만 있는 기록 등은 null)
  kcal: number | null; // detail 모드에서만 채워짐 (#4)
  photoUrl: string | null;
  eatenAt: string; // ISO
}

export interface HistoryWeight {
  weight: number;
  loggedAt: string; // ISO
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** ISO 순간 → 한국(KST) 기준 날짜 키 "YYYY-MM-DD". 서버가 UTC(Vercel)라도 한국 하루로 자른다. */
export function kstDayKey(iso: string): string {
  return new Date(new Date(iso).getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
}

/** "2026-07-09" → "7월 9일 (수)". 요일은 로컬 구성요소로 계산해 시간대에 안전. */
function dayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  return `${m}월 ${d}일 (${WEEKDAY[wd]})`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * 날짜별 회고 묶음 (최근 날짜 먼저). 각 날에 먹은 것들 + 그날 체중 + 직전 기록일 대비 변화.
 * @param meals 사용자의 식사 기록 (title·kcal 등은 서버가 미리 해석해 넣는다)
 * @param weights 사용자의 체중 기록
 */
export function buildMealHistory(
  meals: HistoryMeal[],
  weights: HistoryWeight[],
): MealHistoryDayResponse[] {
  // 그날 체중 = 그 날의 마지막(가장 늦게 잰) 기록
  const weightByDay = new Map<string, { weight: number; at: number }>();
  for (const w of weights) {
    const key = kstDayKey(w.loggedAt);
    const at = new Date(w.loggedAt).getTime();
    const cur = weightByDay.get(key);
    if (!cur || at >= cur.at) weightByDay.set(key, { weight: w.weight, at });
  }

  // 체중 있는 날을 시간순으로 세워 직전 기록일 대비 변화(delta)를 계산 (색 아닌 부호만 — 불변 #1)
  const weightDays = [...weightByDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const deltaByDay = new Map<string, number>();
  for (let i = 1; i < weightDays.length; i++) {
    deltaByDay.set(weightDays[i][0], round1(weightDays[i][1].weight - weightDays[i - 1][1].weight));
  }

  // 끼니를 날짜별로 (그날 안에서는 이른 시간 순)
  const mealsByDay = new Map<string, HistoryMeal[]>();
  for (const meal of meals) {
    const key = kstDayKey(meal.eatenAt);
    const arr = mealsByDay.get(key) ?? [];
    arr.push(meal);
    mealsByDay.set(key, arr);
  }

  // 먹은 기록이 있거나 체중을 잰 날 = '기록이 있는 날'
  const allDays = new Set<string>([...mealsByDay.keys(), ...weightByDay.keys()]);
  const sorted = [...allDays].sort((a, b) => b.localeCompare(a)); // 최근 먼저

  return sorted.map((date) => {
    const dayMeals = (mealsByDay.get(date) ?? []).sort(
      (a, b) => new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime(),
    );
    const kcals = dayMeals.map((m) => m.kcal).filter((k): k is number => k != null);
    const wd = weightByDay.get(date);
    return {
      date,
      label: dayLabel(date),
      weight: wd ? round1(wd.weight) : null,
      weightDelta: deltaByDay.get(date) ?? null,
      totalKcal: kcals.length > 0 ? kcals.reduce((a, b) => a + b, 0) : null,
      meals: dayMeals.map((m) => ({
        id: m.id,
        slot: (m.slot ?? "snack") as MealSlot,
        mode: m.mode,
        title: m.title,
        kcal: m.kcal,
        photoUrl: m.photoUrl,
      })),
    };
  });
}

/** 기록이 있는 달 목록 "YYYY-MM" (최근 먼저) — 월 선택 칩용. buildMealHistory 결과에서 뽑는다. */
export function availableMonths(days: MealHistoryDayResponse[]): string[] {
  const set = new Set(days.map((d) => d.date.slice(0, 7)));
  return [...set].sort((a, b) => b.localeCompare(a));
}
