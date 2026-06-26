"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "soft";
  type?: "button" | "submit";
  className?: string;
}

const variants = {
  primary: "bg-mint text-cocoa",
  soft: "bg-lavender-soft text-cocoa",
} as const;

/** 젤리 버튼 — 누르면 말랑 (Framer Motion 스프링 프리셋, conventions.md 애니메이션 규칙). */
export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "rounded-mochi-sm px-5 py-3 font-medium shadow-mochi-press",
        variants[variant],
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
