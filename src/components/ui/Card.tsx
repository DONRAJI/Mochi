import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** 말랑 카드 — 큰 라운드 + 부드러운 그림자 (디자인 토큰만 사용, 불변 #4). */
export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-mochi bg-cream-50 p-5 shadow-mochi", className)}>{children}</div>
  );
}
