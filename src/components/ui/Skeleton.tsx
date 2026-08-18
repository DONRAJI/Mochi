import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * 불러오는 동안 자리를 지키는 말랑 플레이스홀더 (디자인 토큰만, 불변 #4).
 *
 * 왜 필요한가: 값이 오기 전 `?? 0`으로 **가짜 숫자**를 먼저 그리면 "스트릭 0일 → 12일"처럼
 * 튀고, 그 찰나가 사용자에겐 "아무것도 못 했다"로 읽힌다(불변 #1 죄책감 제로 위반).
 * 숫자 자리에는 0이 아니라 이 플레이스홀더를 둔다.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div aria-hidden className={cn("animate-pulse rounded-mochi-sm bg-cream-200", className)} />
  );
}
