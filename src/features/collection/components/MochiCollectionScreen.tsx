"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Gauge } from "@/components/ui/Gauge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { RetryNotice } from "@/components/ui/RetryNotice";
import { CompleteGauge } from "./CompleteGauge";
import { RarityBadge } from "./RarityBadge";
import { DrawRevealModal } from "./DrawRevealModal";
import { MochiRewardShelf } from "./MochiRewardShelf";
import { ShareButton } from "./ShareButton";
import { useMochiCollection, useDrawCard } from "../hooks/useCollection";
import { RARITY_TINT } from "../rarityTint";
import { cn } from "@/lib/utils";
import type { MochiCardResponse, DrawResultResponse } from "../types";

/** 📖 모찌 도감 (PRD 12) — 건강 행동으로 모은 씨앗으로 모찌 카드를 뽑아 모은다(리텐션 엔진). */
export function MochiCollectionScreen() {
  const { data, isPending, isError, refetch } = useMochiCollection();
  const draw = useDrawCard();
  const [selected, setSelected] = useState<MochiCardResponse | null>(null);
  const [reveal, setReveal] = useState<DrawResultResponse | null>(null);

  const seeds = data?.seeds ?? 0;
  const cost = data?.drawCost ?? 5;
  const cards = data?.cards ?? [];
  const acquired = data?.acquired ?? 0;
  const total = data?.total ?? cards.length;
  const canDraw = seeds >= cost && !draw.isPending;
  const toNext = cost - (seeds % cost); // 다음 뽑기까지 남은 씨앗

  function onDraw() {
    if (seeds < cost || draw.isPending) return;
    draw.mutate(undefined, { onSuccess: (r) => setReveal(r) });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title text-cocoa">모찌 도감</h1>

      {/* 미인증(401)은 전역에서 로그인으로 안내하므로, 여기 남는 건 잠깐 못 불러온 경우다. */}
      {isError && <RetryNotice onRetry={() => refetch()} />}

      {!isError && isPending && <CollectionSkeleton />}

      {!isError && !isPending && (
        <>
          {/* 씨앗 + 뽑기 — 건강한 행동으로 모은 씨앗으로 (결제 없음) */}
          <Card className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-display text-cocoa">🌱 씨앗 {seeds}</span>
              <span className="text-cocoa-faint">
                {canDraw ? "지금 뽑을 수 있어요!" : `다음 뽑기까지 ${toNext}개`}
              </span>
            </div>
            <Gauge value={canDraw ? cost : seeds % cost} max={cost} tone="mint" />
            <Button
              className={cn("w-full", !canDraw && "opacity-60")}
              onClick={onDraw}
            >
              {draw.isPending
                ? "뽑는 중이에요…"
                : canDraw
                  ? `🎁 모찌 뽑기 (씨앗 ${cost})`
                  : `씨앗 ${toNext}개 더 모으면 뽑아요`}
            </Button>
            {draw.isError && (
              <p className="text-center text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
            )}
          </Card>

          <CompleteGauge have={acquired} total={total} />

          <div className="grid grid-cols-3 gap-3">
            {cards.map((c) => (
              <MochiCardTile key={c.id} card={c} onClick={() => c.acquired && setSelected(c)} />
            ))}
          </div>

          <MochiRewardShelf cards={cards} />
          <ShareButton tabLabel="모찌" acquired={acquired} />
        </>
      )}

      <DrawRevealModal
        result={reveal}
        // 방금 뽑기 후엔 서버가 알려준 잔여 씨앗(seedsLeft)으로 판단 — 캐시 갱신 전 stale 방지.
        canDrawAgain={(reveal?.seedsLeft ?? seeds) >= cost}
        drawing={draw.isPending}
        onDrawAgain={onDraw}
        onClose={() => setReveal(null)}
      />

      <Modal open={selected !== null} onClose={() => setSelected(null)}>
        {selected && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={cn("rounded-mochi p-3", RARITY_TINT[selected.rarity] ?? "bg-cream-100")}>
              <Image
                src={selected.imageUrl}
                alt={selected.name}
                width={200}
                height={200}
                className="h-40 w-40 object-contain"
              />
            </div>
            <RarityBadge rarity={selected.rarity} />
            <p className="font-display text-lg text-cocoa">{selected.name}</p>
            <p className="text-sm text-cocoa-soft">{selected.flavor}</p>
            {selected.count > 1 && (
              <p className="text-sm text-cocoa-faint">×{selected.count} 만큼 친해요 🤍</p>
            )}
            <Button className="w-full" onClick={() => setSelected(null)}>
              닫기
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

/**
 * 불러오는 동안의 도감 자리 — 씨앗 수·컬렉션 수는 값이 오기 전 0으로 그리면
 * "씨앗 0 · 5개 더 모으면"이 떴다가 실제 값으로 튄다(불변 #1). 자리만 지킨다.
 */
function CollectionSkeleton() {
  return (
    <>
      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-11 w-full rounded-mochi" />
      </Card>
      <Skeleton className="h-[86px] w-full rounded-mochi" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="aspect-square w-full rounded-mochi" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </>
  );
}

/** 카드 한 칸 — 획득=풀컬러 이미지, 미획득=실루엣 ❓ 티저(등급 톤). */
function MochiCardTile({ card, onClick }: { card: MochiCardResponse; onClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={!card.acquired}
        className={cn(
          "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-mochi transition-transform ease-jelly",
          RARITY_TINT[card.rarity] ?? "bg-cream-100",
          card.acquired ? "shadow-mochi-press active:scale-95" : "opacity-70",
        )}
      >
        {card.acquired ? (
          <>
            <Image
              src={card.imageUrl}
              alt={card.name}
              width={140}
              height={140}
              className="h-full w-full object-contain p-1"
            />
            {card.count > 1 && (
              <span className="absolute bottom-1 right-1 rounded-mochi-sm bg-cream-50/90 px-1 text-[10px] text-cocoa">
                ×{card.count}
              </span>
            )}
          </>
        ) : (
          <span className="text-3xl text-cocoa-faint">❓</span>
        )}
      </button>
      <span className="w-full truncate text-center text-[11px] text-cocoa-soft">
        {card.acquired ? card.name : "???"}
      </span>
    </div>
  );
}
