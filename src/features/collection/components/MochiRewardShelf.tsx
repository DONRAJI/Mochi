"use client";

import { Card } from "@/components/ui/Card";
import { RarityBadge } from "./RarityBadge";
import { cn } from "@/lib/utils";
import type { MochiCardResponse } from "../types";

/** 등급 순서·완성 보상 뱃지 (아트 없이 인정 보상 — PRD 12.5 컴플리트 보상). */
const TIERS: { rarity: string; label: string; reward: string }[] = [
  { rarity: "common", label: "일반", reward: "🌱" },
  { rarity: "rare", label: "레어", reward: "🩷" },
  { rarity: "epic", label: "에픽", reward: "💜" },
  { rarity: "legendary", label: "전설", reward: "👑" },
];

/**
 * 도감 보상 — 등급별 완성 현황과 완성 뱃지. 죄책감 제로: 미완성도 '앞으로 N개' 긍정 프레이밍.
 * 전 등급 완성 시 명예의 전당.
 */
export function MochiRewardShelf({ cards }: { cards: MochiCardResponse[] }) {
  if (cards.length === 0) return null;
  const allDone = cards.every((c) => c.acquired);

  return (
    <Card className="flex flex-col gap-2">
      <p className="font-display text-cocoa">도감 보상</p>
      {TIERS.map((t) => {
        const inTier = cards.filter((c) => c.rarity === t.rarity);
        const acquired = inTier.filter((c) => c.acquired).length;
        const total = inTier.length;
        const complete = total > 0 && acquired === total;
        return (
          <div
            key={t.rarity}
            className={cn(
              "flex items-center gap-2 rounded-mochi-sm px-2.5 py-2 text-sm",
              complete ? "bg-butter-soft" : "bg-cream-100",
            )}
          >
            <RarityBadge rarity={t.rarity} />
            <span className="text-cocoa">{t.label} 도감</span>
            <span className="ml-auto text-cocoa-soft">
              {complete ? (
                <span className="font-display text-cocoa">완성 {t.reward}</span>
              ) : (
                `${acquired} / ${total}`
              )}
            </span>
          </div>
        );
      })}
      {allDone && (
        <p className="mt-1 text-center text-sm font-display text-cocoa">
          👑 명예의 전당 — 모든 모찌와 친구가 됐어요!
        </p>
      )}
    </Card>
  );
}
