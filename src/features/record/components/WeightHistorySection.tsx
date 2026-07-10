"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useWeightLogs } from "../hooks/useRecord";
import {
  availableYears,
  availableGranularities,
  groupByMonth,
  groupByWeek,
  groupByYear,
  type Granularity,
  type PeriodStat,
  type Trend,
} from "../weightStats";

/** 추세는 화살표로만 (색으로 벌하지 않음 — 불변 #1). down='좋다'가 아니라 흐름 방향일 뿐. */
const TREND_ARROW: Record<Trend, string> = { down: "↘", up: "↗", flat: "→" };
const TREND_WORD: Record<Trend, string> = { down: "부드러워졌어요", up: "살짝 올랐어요", flat: "유지했어요" };

/**
 * 파스텔 셀 톤 (PRD 6.3 "부드러운 heatmap") — 구간 평균보다 가벼우면 민트, 무거우면 라벤더, 근처는 크림.
 * 빨강/초록 대비 금지(불변 #1). 토큰만 사용(불변 #4).
 */
function cellTone(avg: number, lo: number, hi: number): string {
  const mid = (lo + hi) / 2;
  if (avg <= mid - 0.3) return "bg-mint-soft";
  if (avg >= mid + 0.3) return "bg-lavender-soft";
  return "bg-cream-100";
}

const GRANULARITY_LABEL: Record<Granularity, string> = {
  week: "주간",
  month: "월별",
  year: "연간",
};

/**
 * 체중 정리 — 주간/월별/연간 그래프 + 표 (PRD 6장·6.3).
 * 기록이 쌓일수록 단계가 열린다: 처음엔 주간만 → 다른 달이 생기면 월별 → 여러 해가 쌓이면 연간.
 * 기본은 열려 있는 가장 넓은 시야(coarsest) — "최대로는 연간까지" 자연스레 확장.
 * 마이 전용 체중 화면에서만 숫자 노출(불변 #2). WeightSection(입력·최근 흐름) 아래에 붙는다.
 */
export function WeightHistorySection() {
  const { data } = useWeightLogs();
  const points = useMemo(() => data ?? [], [data]);

  const levels = useMemo(() => availableGranularities(points), [points]);
  // 사용자가 고른 단계가 아직 유효하면 유지, 아니면 열린 것 중 가장 넓은 시야로 기본.
  const [picked, setPicked] = useState<Granularity | null>(null);
  const view: Granularity = picked && levels.includes(picked) ? picked : levels[levels.length - 1];

  const years = useMemo(() => availableYears(points), [points]);
  const [year, setYear] = useState<number | null>(null);
  const activeYear = year ?? years[0] ?? new Date().getFullYear();

  const stats: PeriodStat[] = useMemo(() => {
    if (view === "year") return groupByYear(points);
    if (view === "month") return groupByMonth(points, activeYear);
    return groupByWeek(points, 12);
  }, [points, view, activeYear]);

  if (points.length < 2) return null; // 입력 섹션이 이미 빈 상태 안내를 한다

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-cocoa">체중 정리</p>
        {levels.length > 1 && (
          <SegmentedControl
            className="w-44"
            options={levels.map((g) => ({ value: g, label: GRANULARITY_LABEL[g] }))}
            value={view}
            onChange={(v) => setPicked(v as Granularity)}
          />
        )}
      </div>

      {view === "month" && years.length > 1 && (
        <div className="flex gap-1.5">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              className={`rounded-mochi-sm px-3 py-1 text-sm transition-transform ease-jelly active:scale-95 ${
                y === activeYear ? "bg-lavender text-cocoa" : "bg-cream-200 text-cocoa-faint"
              }`}
            >
              {y}년
            </button>
          ))}
        </div>
      )}

      {stats.length >= 2 ? (
        <PeriodChart stats={stats} />
      ) : (
        <p className="py-2 text-center text-sm text-cocoa-soft">
          이 구간은 아직 기록이 적어요. 조금 더 쌓아볼까요? 🌿
        </p>
      )}

      <PeriodTable stats={stats} />
    </Card>
  );
}

/** 구간 평균 흐름 그래프 — 라벤더 톤(최근 흐름 민트와 구분). 추세>절대수치(PRD 6.1). */
function PeriodChart({ stats }: { stats: PeriodStat[] }) {
  const W = 300;
  const H = 120;
  const PAD = 14;
  const avgs = stats.map((s) => s.avg);
  const min = Math.min(...avgs) - 0.5;
  const max = Math.max(...avgs) + 0.5;
  const span = max - min || 1;
  const xs = stats.map((_, i) => PAD + (i * (W - 2 * PAD)) / (stats.length - 1));
  const ys = stats.map((s) => PAD + (H - 2 * PAD) * (1 - (s.avg - min) / span));
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${line} L${xs[xs.length - 1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full" role="img" aria-label="체중 구간 평균 흐름">
      <path d={area} className="fill-lavender-soft" />
      <path
        d={line}
        className="fill-none stroke-lavender-deep"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {xs.map((x, i) => (
        <g key={stats[i].key}>
          <circle cx={x} cy={ys[i]} r={3} className="fill-lavender-deep" />
          <text x={x} y={H + 12} fontSize={9} textAnchor="middle" className="fill-cocoa-faint">
            {stats[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** 정리 표 (엑셀 월별 표 대응) — 구간 / 평균 / 최저~최고 / 추세 화살표. */
function PeriodTable({ stats }: { stats: PeriodStat[] }) {
  if (stats.length === 0) return null;
  const avgs = stats.map((s) => s.avg);
  const lo = Math.min(...avgs);
  const hi = Math.max(...avgs);

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 text-xs text-cocoa-faint">
        <span>구간</span>
        <span className="text-right">평균</span>
        <span className="text-right">흐름</span>
      </div>
      {stats.map((s) => (
        <div
          key={s.key}
          className={`grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-mochi-sm px-2 py-2 text-sm ${cellTone(s.avg, lo, hi)}`}
        >
          <span className="text-cocoa">
            {s.label}
            <span className="ml-1.5 text-xs text-cocoa-faint">
              {s.min === s.max ? `${s.min}kg` : `${s.min}~${s.max}kg`}
            </span>
          </span>
          <span className="text-right font-display text-cocoa">{s.avg}kg</span>
          <span
            className="text-right text-cocoa-soft"
            title={TREND_WORD[s.trend]}
            aria-label={TREND_WORD[s.trend]}
          >
            {TREND_ARROW[s.trend]}
          </span>
        </div>
      ))}
    </div>
  );
}
