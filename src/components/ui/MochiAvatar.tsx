"use client";

import { motion } from "framer-motion";
import type { MochiState } from "@/types/mochi";
import { cn } from "@/lib/utils";

interface MochiAvatarProps {
  state?: MochiState;
  className?: string;
}

// 상태별 표정 — 추후 public/mochi/<state>(Lottie/PNG)로 교체 (DS 마스코트 아트 존재).
const face: Record<MochiState, string> = {
  happy: "◕‿◕",
  sleepy: "－‿－",
  idle: "•‿•",
  cheer: "＾▽＾",
};

// 상태별 파스텔 타일 (DS와 동일 매핑)
const bg: Record<MochiState, string> = {
  happy: "bg-butter",
  sleepy: "bg-lavender",
  idle: "bg-mint-soft",
  cheer: "bg-peach",
};

/** 모찌 캐릭터. 진행도는 숫자가 아니라 이 표정/상태로 (불변 #2). 볼터치로 캐릭터성 부여(DS). */
export function MochiAvatar({ state = "idle", className }: MochiAvatarProps) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "relative flex h-40 w-40 items-center justify-center rounded-mochi-lg font-display text-3xl text-cocoa shadow-mochi",
        bg[state],
        className,
      )}
      aria-label={`모찌 (${state})`}
    >
      {/* 블러시 볼터치 */}
      <span className="absolute left-[22%] top-[58%] h-2.5 w-5 rounded-full bg-peach-deep/50" />
      <span className="absolute right-[22%] top-[58%] h-2.5 w-5 rounded-full bg-peach-deep/50" />
      <span className="relative z-10">{face[state]}</span>
    </motion.div>
  );
}
