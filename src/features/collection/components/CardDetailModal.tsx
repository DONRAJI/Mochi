"use client";

import { Modal } from "@/components/ui/Modal";
import { RarityBadge } from "./RarityBadge";
import type { MockCollectible } from "../data";

/** 카드 상세 — 획득일·만든 횟수·모찌 코멘트(플레이버 텍스트) (PRD 5.4·7.3). */
export function CardDetailModal({
  item,
  onClose,
}: {
  item: MockCollectible | null;
  onClose: () => void;
}) {
  return (
    <Modal open={item !== null} onClose={onClose}>
      {item && (
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-6xl">{item.emoji}</span>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-cocoa">{item.name}</h3>
            <RarityBadge rarity={item.rarity} />
          </div>
          <p className="text-sm text-cocoa-soft">{item.comment}</p>
          <p className="text-xs text-cocoa-faint">
            획득 {item.acquiredAt} · 만든 횟수 {item.count}
          </p>
        </div>
      )}
    </Modal>
  );
}
