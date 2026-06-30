"use client";

import { Modal } from "@/components/ui/Modal";
import { RarityBadge } from "./RarityBadge";
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
          <span className="text-6xl">{item.emoji ?? "🍽️"}</span>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-cocoa">{item.name}</h3>
            <RarityBadge rarity={item.rarity} />
          </div>
          <p className="text-sm text-cocoa-soft">모찌랑 같이 모은 한 칸이에요 🍮</p>
          {item.acquiredAt && (
            <p className="text-xs text-cocoa-faint">획득 {item.acquiredAt.slice(0, 10)}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
