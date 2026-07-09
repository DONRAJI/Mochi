"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RarityBadge } from "./RarityBadge";
import { RARITY_TINT, RARITY_RING, isSpecial } from "../rarityTint";
import { cn } from "@/lib/utils";
import type { DrawResultResponse } from "../types";

/** ✨ 스파클 위치 — 카드 주변 3곳 (에픽 이상·첫 획득 연출, 7.3#6). */
const SPARKLE_POS = ["-left-3 top-3", "-right-2 -top-2", "-right-4 bottom-8"] as const;

interface DrawRevealModalProps {
  result: DrawResultResponse | null;
  canDrawAgain: boolean;
  drawing: boolean;
  onDrawAgain: () => void;
  onClose: () => void;
}

/**
 * 뽑기 결과 연출 (PRD 12.5 — 오늘의 발견) — 씨앗(뒷면)이 두근두근 싹트다 카드로 뒤집힌다.
 * 에픽 이상은 서스펜스가 길고 떨림이 빨라지며 링 강조 + ✨, 첫 획득도 ✨. 탭하면 바로 열림.
 * 중복은 "더 친해졌어요 ×N + 씨앗 환급"(중복=진행, 죄책감 제로).
 */
export function DrawRevealModal({
  result,
  canDrawAgain,
  drawing,
  onDrawAgain,
  onClose,
}: DrawRevealModalProps) {
  return (
    <Modal open={result !== null} onClose={onClose}>
      {result && (
        <RevealCard
          key={`${result.card.id}-${result.card.count}`} // 뽑을 때마다 씨앗부터 다시 (리마운트로 상태 초기화)
          result={result}
          canDrawAgain={canDrawAgain}
          drawing={drawing}
          onDrawAgain={onDrawAgain}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function RevealCard({
  result,
  canDrawAgain,
  drawing,
  onDrawAgain,
  onClose,
}: DrawRevealModalProps & { result: DrawResultResponse }) {
  const special = isSpecial(result.card.rarity);
  const sparkle = special || result.isNew;
  const [flipped, setFlipped] = useState(false);

  // 서스펜스 후 자동 플립 — 에픽 이상은 조금 더 두근두근.
  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), special ? 1300 : 850);
    return () => clearTimeout(t);
  }, [special]);

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-sm text-cocoa-faint">
        {!flipped ? "씨앗이 싹트는 중…" : result.isNew ? "처음 만났어요!" : "또 반가워요"}
      </p>

      {/* 카드 플립 — 뒷면(씨앗) → 앞면(카드) */}
      <div className="relative [perspective:900px]">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotateY: flipped ? 180 : 0 }}
          transition={{
            scale: { type: "spring", stiffness: 240, damping: 15 },
            opacity: { duration: 0.15 },
            rotateY: { duration: 0.55, ease: "easeInOut" },
          }}
          className="relative h-[184px] w-[184px] [transform-style:preserve-3d]"
        >
          {/* 뒷면 — 씨앗이 두근두근 (탭하면 바로 열기) */}
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="absolute inset-0 flex items-center justify-center rounded-mochi bg-cream-100 shadow-mochi [backface-visibility:hidden]"
          >
            <motion.span
              className="text-5xl"
              animate={flipped ? { rotate: 0 } : { rotate: [0, -5, 5, -3, 3, 0] }}
              transition={
                flipped
                  ? undefined
                  : { repeat: Infinity, duration: special ? 0.55 : 1.0, ease: "easeInOut" }
              }
            >
              🌱
            </motion.span>
          </button>

          {/* 앞면 — 등급 톤 + (에픽 이상) 등급색 링 */}
          <div
            className={cn(
              "absolute inset-0 rounded-mochi p-3 shadow-mochi [backface-visibility:hidden] [transform:rotateY(180deg)]",
              RARITY_TINT[result.card.rarity] ?? "bg-cream-100",
              RARITY_RING[result.card.rarity],
            )}
          >
            <Image
              src={result.card.imageUrl}
              alt={result.card.name}
              width={200}
              height={200}
              className="h-40 w-40 object-contain"
            />
          </div>
        </motion.div>

        {/* ✨ 스파클 — 에픽 이상·첫 획득, 플립 후 스태거 팝 */}
        {flipped &&
          sparkle &&
          SPARKLE_POS.map((pos, i) => (
            <motion.span
              key={pos}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.45 }}
              className={cn("pointer-events-none absolute text-xl", pos)}
            >
              ✨
            </motion.span>
          ))}
      </div>

      {/* 카드 정보 + 버튼 — 플립 후에 스르륵 (높이는 유지해 모달이 안 튀게) */}
      <motion.div
        animate={{ opacity: flipped ? 1 : 0, y: flipped ? 0 : 8 }}
        transition={{ delay: flipped ? 0.2 : 0, duration: 0.3 }}
        className={cn("flex w-full flex-col items-center gap-3", !flipped && "pointer-events-none")}
      >
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
      </motion.div>
    </div>
  );
}
