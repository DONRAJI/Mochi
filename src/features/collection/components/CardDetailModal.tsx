"use client";

import { Modal } from "@/components/ui/Modal";
import { RarityBadge } from "./RarityBadge";
import { flavorText } from "../flavor";
import type { CollectibleResponse } from "../types";

/** 카드 상세 — 획득일 + 모찌 코멘트(플레이버 텍스트는 Phase 1C에서 LLM 생성). */
export function CardDetailModal({
  item,
  onClose,
}: {
  item: CollectibleResponse | null;
  onClose: () => void;
}) {
  return (
    <Modal open={item !== null} onClose={onClose}>
      {item && (
        <div className="flex flex-col items-center gap-2 text-center">
          {/* 미획득은 실루엣 티저(PRD 7.3 #1): ❓·??? 로 호기심 자극 */}
          <span className="text-6xl">{item.acquired ? (item.emoji ?? "🍽️") : "❓"}</span>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-cocoa">{item.acquired ? item.name : "???"}</h3>
            {item.acquired && <RarityBadge rarity={item.rarity} />}
          </div>
          <p className="text-sm text-cocoa-soft">{flavorText(item.rarity, item.acquired)}</p>
          {item.acquiredAt && (
            <p className="text-xs text-cocoa-faint">획득 {item.acquiredAt.slice(0, 10)}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
