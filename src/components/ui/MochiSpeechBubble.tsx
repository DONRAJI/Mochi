import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MochiSpeechBubbleProps {
  children: ReactNode;
  className?: string;
}

/** 모찌 한마디 — 격려·알림 통합 말풍선. 경고 톤 금지, 부드럽게 (불변 #1). */
export function MochiSpeechBubble({ children, className }: MochiSpeechBubbleProps) {
  return (
    <p
      className={cn(
        "rounded-mochi bg-cream-50 px-4 py-3 text-center text-cocoa-soft shadow-mochi-press",
        className,
      )}
    >
      {children}
    </p>
  );
}
