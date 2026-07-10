/**
 * 체중 기록 집계 (순수 함수, PRD 6장·6.3) — 일별 기록을 주간/월별로 묶어 "정리된 표·그래프"로.
 *
 * 죄책감 제로(불변 #1): 추세는 화살표로만 표현하고 색으로 벌하지 않는다(빨강/초록 금지).
 * 숫자는 마이>더보기에서만(불변 #2). 브라우저 로컬 시간(=KST) 기준으로 연/월/주를 자른다.
 */
import type { WeightLogResponse } from "./types";

/** 이전 구간 평균 대비 흐름. down이 '좋다'가 아니라 그냥 흐름의 방향(가치판단 없음). */
export type Trend = "down" | "up" | "flat";

/** 정리 뷰 단위 — 기록이 쌓일수록 주간→월별→연간으로 시야가 넓어진다. */
export type Granularity = "week" | "month" | "year";

export interface PeriodStat {
  key: string; // 정렬·식별용 (예: "2024-07", "2024-07-22")
  label: string; // 표시용 (예: "7월", "7/22")
  avg: number; // 평균 체중 (0.1 반올림)
  min: number;
  max: number;
  count: number; // 기록 일수
  trend: Trend; // 직전 구간 평균 대비
}

/** kg 이내 변화는 '유지(flat)'로 본다 — 일상적 변동에 일희일비하지 않게. */
const TREND_EPS = 0.15;

const round1 = (n: number) => Math.round(n * 10) / 10;

function trendOf(cur: number, prev: number | null): Trend {
  if (prev == null) return "flat";
  const d = cur - prev;
  if (d <= -TREND_EPS) return "down";
  if (d >= TREND_EPS) return "up";
  return "flat";
}

function summarize(key: string, label: string, ws: number[], prevAvg: number | null): PeriodStat {
  const avg = round1(ws.reduce((a, b) => a + b, 0) / ws.length);
  return {
    key,
    label,
    avg,
    min: round1(Math.min(...ws)),
    max: round1(Math.max(...ws)),
    count: ws.length,
    trend: trendOf(avg, prevAvg),
  };
}

/** 기록이 있는 연도들 (최근 연도 먼저) — 연도별 토글용. */
export function availableYears(points: WeightLogResponse[]): number[] {
  const years = new Set(points.map((p) => new Date(p.loggedAt).getFullYear()));
  return [...years].sort((a, b) => b - a);
}

/** 특정 연도의 월별 요약 (1→12월 순, 기록 있는 달만). 추세는 직전 달 평균 대비. */
export function groupByMonth(points: WeightLogResponse[], year: number): PeriodStat[] {
  const buckets = new Map<number, number[]>();
  for (const p of points) {
    const d = new Date(p.loggedAt);
    if (d.getFullYear() !== year) continue;
    const m = d.getMonth();
    const arr = buckets.get(m) ?? [];
    arr.push(p.weight);
    buckets.set(m, arr);
  }
  const months = [...buckets.keys()].sort((a, b) => a - b);
  const stats: PeriodStat[] = [];
  let prevAvg: number | null = null;
  for (const m of months) {
    const s = summarize(
      `${year}-${String(m + 1).padStart(2, "0")}`,
      `${m + 1}월`,
      buckets.get(m)!,
      prevAvg,
    );
    stats.push(s);
    prevAvg = s.avg;
  }
  return stats;
}

/** 전체 연도별 요약 (과거→현재, 기록 있는 해만). 각 해 평균 1점, 추세는 직전 해 평균 대비. */
export function groupByYear(points: WeightLogResponse[]): PeriodStat[] {
  const buckets = new Map<number, number[]>();
  for (const p of points) {
    const y = new Date(p.loggedAt).getFullYear();
    const arr = buckets.get(y) ?? [];
    arr.push(p.weight);
    buckets.set(y, arr);
  }
  const years = [...buckets.keys()].sort((a, b) => a - b);
  const stats: PeriodStat[] = [];
  let prevAvg: number | null = null;
  for (const y of years) {
    const s = summarize(String(y), `${y}년`, buckets.get(y)!, prevAvg);
    stats.push(s);
    prevAvg = s.avg;
  }
  return stats;
}

/**
 * 기록이 쌓인 정도에 따라 열리는 뷰 단계 (주간→월별→연간). 항상 최소 '주간'.
 * 서로 다른 달이 2개 이상이면 월별, 서로 다른 해가 2개 이상이면 연간이 추가로 열린다.
 * "다음 달이 되면 월간, 여러 해가 쌓이면 연간" 자연 확장(PRD 6장).
 */
export function availableGranularities(points: WeightLogResponse[]): Granularity[] {
  const months = new Set(
    points.map((p) => {
      const d = new Date(p.loggedAt);
      return `${d.getFullYear()}-${d.getMonth()}`;
    }),
  );
  const years = new Set(points.map((p) => new Date(p.loggedAt).getFullYear()));
  const out: Granularity[] = ["week"];
  if (months.size >= 2) out.push("month");
  if (years.size >= 2) out.push("year");
  return out;
}

/** 그 주의 월요일(로컬 자정)로 정규화 — 주간 버킷 키. (week.ts와 동일하게 월=주 시작) */
function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // 월=0
  x.setDate(x.getDate() - day);
  return x;
}

/** 최근 `limit`주의 주간 요약 (과거→현재). 추세는 전체 순서에서 계산 후 잘라 첫 주도 정확. */
export function groupByWeek(points: WeightLogResponse[], limit = 12): PeriodStat[] {
  const buckets = new Map<string, { ws: number[]; monday: Date }>();
  for (const p of points) {
    const monday = mondayOf(new Date(p.loggedAt));
    const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
    const b = buckets.get(key) ?? { ws: [], monday };
    b.ws.push(p.weight);
    buckets.set(key, b);
  }
  const keys = [...buckets.keys()].sort();
  const stats: PeriodStat[] = [];
  let prevAvg: number | null = null;
  for (const key of keys) {
    const { ws, monday } = buckets.get(key)!;
    const s = summarize(key, `${monday.getMonth() + 1}/${monday.getDate()}`, ws, prevAvg);
    stats.push(s);
    prevAvg = s.avg;
  }
  return stats.slice(-limit);
}
