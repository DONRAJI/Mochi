import type { WeightLogResponse } from "../types";

/**
 * 체중 흐름 그래프 (PRD 6장). 추세 > 절대수치 · 빨강/초록 대비 금지 · 모찌가 곡선 위를 걷기.
 * 숫자는 여기(마이>더보기)에서만 (불변 #2). 실데이터 points를 받는다(최소 2개).
 */
const W = 300;
const H = 120;
const PAD = 12;

export function WeightTrendChart({ points }: { points: WeightLogResponse[] }) {
  const ws = points.map((p) => p.weight);
  const min = Math.min(...ws) - 0.5;
  const max = Math.max(...ws) + 0.5;
  const span = max - min || 1;
  const xs = points.map((_, i) => PAD + (i * (W - 2 * PAD)) / (points.length - 1));
  const ys = points.map((p) => PAD + (H - 2 * PAD) * (1 - (p.weight - min) / span));

  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${line} L${xs[xs.length - 1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;
  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];
  const easing = points[points.length - 1].weight <= points[0].weight ? "부드러워지고" : "잘 흐르고";

  return (
    <div>
      <p className="mb-2 text-sm text-cocoa-soft">체중 흐름</p>
      <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full" role="img" aria-label="체중 추세">
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
        <text x={lastX} y={lastY - 8} fontSize={16} textAnchor="middle">
          🧊
        </text>
      </svg>
      <p className="mt-1 text-center text-sm text-cocoa-soft">
        지난 기록보다 흐름이 {easing} 있어요 😊
      </p>
    </div>
  );
}
