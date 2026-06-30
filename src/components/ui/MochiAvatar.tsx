"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { MochiState } from "@/types/mochi";
import { cn } from "@/lib/utils";

interface MochiAvatarProps {
  state?: MochiState;
  className?: string;
  priority?: boolean;
}

/**
 * 모찌 캐릭터 (실제 아트). 진행도는 숫자가 아니라 표정/상태로 표현한다 (불변 #2).
 * 상태별 스프라이트: public/mochi/<state>.png (happy·sleepy·idle·cheer).
 * 부드러운 idle 바운스로 살아있는 느낌. 볼터치·복숭아 장식은 아트에 포함됨.
 */
export function MochiAvatar({ state = "idle", className, priority = false }: MochiAvatarProps) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      className={cn("relative h-40 w-40", className)}
      aria-label={`모찌 (${state})`}
    >
      <Image
        src={`/mochi/${state}.png`}
        alt={`모찌 ${state}`}
        fill
        sizes="160px"
        priority={priority}
        draggable={false}
        className="select-none object-contain"
      />
    </motion.div>
  );
}
