import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** 말랑 입력칸 — 디자인 토큰만 (불변 #4). */
export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-mochi-sm bg-cream-50 px-4 py-3 text-cocoa shadow-mochi-press outline-none placeholder:text-cocoa-faint focus:bg-cream-200",
        className,
      )}
      {...props}
    />
  );
}
