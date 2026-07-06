"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RarityBadge } from "./RarityBadge";
import { RARITY_TINT, isSpecial } from "../rarityTint";
import { cn } from "@/lib/utils";
import type { DrawResultResponse } from "../types";

/**
 * 뽑기 결과 연출 (PRD 12.5 — 오늘의 발견) — 카드가 팝업되며 등급별 톤·반짝임.
 * 첫 획득 "처음 만났어요!", 중복은 "더 친해졌어요 ×N + 씨앗 환급"(중복=진행, 죄책감 제로).
 */
export function DrawRevealModal({
  result,
  canDrawAgain,
  drawing,
  onDrawAgain,
  onClose,
}: {
  result: DrawResultResponse | null;
  canDrawAgain: boolean;
  drawing: boolean;
  onDrawAgain: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={result !== null} onClose={onClose}>
      {result && (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-cocoa-faint">
            {result.isNew ? "처음 만났어요!" : "또 반가워요"}
          </p>

          <motion.div
            key={result.card.id + result.card.count}
            initial={{ scale: 0.6, rotate: -6, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
            className={cn(
              "relative rounded-mochi p-3 shadow-mochi",
              RARITY_TINT[result.card.rarity] ?? "bg-cream-100",
            )}
          >
            {isSpecial(result.card.rarity) && (
              <span className="pointer-events-none absolute -right-1 -top-2 text-xl">✨</span>
            )}
            <Image
              src={result.card.imageUrl}
              alt={result.card.name}
              width={200}
              height={200}
              className="h-40 w-40 object-contain"
            />
          </motion.div>

          <RarityBadge rarity={result.card.rarity} />
          <p className="font-display text-lg text-cocoa">{result.card.name}</p>
          <p className="text-sm text-cocoa-soft">{result.card.flavor}</p>
          {!result.isNew && (
            <p className="text-sm text-cocoa-faint">
              더 친해졌어요 ×{result.card.count} · 🌱 +{result.refund}
            </p>
          )}

          <div className="mt-1 flex w-full gap-2">
            {canDrawAgain && (
              <Button variant="soft" className="flex-1" onClick={onDrawAgain}>
                {drawing ? "뽑는 중…" : "한 번 더"}
              </Button>
            )}
            <Button className="flex-1" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
