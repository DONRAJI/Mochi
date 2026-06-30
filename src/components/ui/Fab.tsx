"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FabProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/** 플로팅 액션 버튼 — 탭 바 위에 떠 있는 추가 버튼. */
export function Fab({ onClick, children, className, ...rest }: FabProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-mochi-lg bg-mint text-2xl text-cocoa shadow-mochi",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
