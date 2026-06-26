"use client";

import { motion } from "framer-motion";
import type { MochiState } from "@/types/mochi";
import { cn } from "@/lib/utils";

interface MochiAvatarProps {
  state?: MochiState;
  className?: string;
}

// 상태별 표정 — 추후 public/mochi/<state>.json(Lottie)로 교체 (PRD 9장 구현 메모).
// 지금은 에셋 없이 동작하도록 정적 표현 + 말랑 바운스로 시작.
const face: Record<MochiState, string> = {
  happy: "◕‿◕",
  sleepy: "－‿－",
  idle: "•‿•",
  cheer: "＾▽＾",
};

const bg: Record<MochiState, string> = {
  happy: "bg-butter",
  sleepy: "bg-lavender",
  idle: "bg-mint-soft",
  cheer: "bg-peach",
};

/** 모찌 캐릭터. 진행도는 숫자가 아니라 이 표정/상태로 표현한다 (불변 #2). */
export function MochiAvatar({ state = "idle", className }: MochiAvatarProps) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "flex h-40 w-40 items-center justify-center rounded-mochi-lg text-3xl text-cocoa shadow-mochi",
        bg[state],
        className,
      )}
      aria-label={`모찌 (${state})`}
    >
      {face[state]}
    </motion.div>
  );
}
