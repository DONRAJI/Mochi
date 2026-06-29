import { Card } from "@/components/ui/Card";
import { MOCK_WEIGHT } from "../data";

/**
 * 체중 흐름 그래프 (PRD 6장).
 * 추세 > 절대수치 · 빨강/초록 대비 금지 · 모찌가 곡선 위를 걷기 · 서술형 인사이트.
 * 숫자는 여기(마이>더보기)에서만 (불변 #2).
 */
const W = 300;
const H = 120;
const PAD = 12;

export function WeightTrendChart() {
  const pts = MOCK_WEIGHT;
  const min = Math.min(...pts.map((p) => p.avg)) - 0.5;
  const max = Math.max(...pts.map((p) => p.avg)) + 0.5;
  const xs = pts.map((_, i) => PAD + (i * (W - 2 * PAD)) / (pts.length - 1));
  const ys = pts.map((p) => PAD + (H - 2 * PAD) * (1 - (p.avg - min) / (max - min)));

  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${line} L${xs[xs.length - 1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;
  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];

  return (
    <Card>
      <p className="mb-2 text-sm text-cocoa-soft">체중 흐름 (월 평균)</p>
      <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full" role="img" aria-label="체중 월 평균 추세">
        <path d={area} className="fill-mint-soft" />
        <path
          d={line}
          className="fill-none stroke-mint-deep"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r={3} className="fill-mint-deep" />
        ))}
        {/* 곡선 위를 걷는 모찌 */}
        <text x={lastX} y={lastY - 8} fontSize={16} textAnchor="middle">
          🧊
        </text>
      </svg>
      <p className="mt-1 text-center text-sm text-cocoa-soft">
        지난달보다 흐름이 부드러워지고 있어요 😊
      </p>

      {/* 월별 요약 — 파스텔 셀, 강한 색 금지 */}
      <div className="mt-3 overflow-hidden rounded-mochi-sm text-center text-xs">
        <div className="grid grid-cols-3 bg-cream-200 py-1 text-cocoa-soft">
          <span>월</span>
          <span>평균</span>
          <span>추세</span>
        </div>
        {pts.map((p, i) => {
          const prev = i > 0 ? pts[i - 1].avg : p.avg;
          const arrow = p.avg < prev ? "↘︎" : p.avg > prev ? "↗︎" : "→";
          return (
            <div
              key={p.month}
              className={`grid grid-cols-3 py-1 text-cocoa ${i % 2 ? "bg-lavender-soft" : "bg-cream-50"}`}
            >
              <span>{p.month}</span>
              <span>{p.avg.toFixed(1)}</span>
              <span className="text-cocoa-faint">{arrow}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
