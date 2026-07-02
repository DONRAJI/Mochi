"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CompleteGauge } from "./CompleteGauge";
import { CollectibleCard } from "./CollectibleCard";
import { CardDetailModal } from "./CardDetailModal";
import { RewardChest } from "./RewardChest";
import { ShareButton } from "./ShareButton";
import { useCollection } from "../hooks/useCollection";
import { COLLECTION_TABS } from "../data";
import type { CollectionTab, CollectibleResponse } from "../types";
import { messages } from "@/lib/messages";

const TAB_LABEL: Record<CollectionTab, string> = {
  recipe: "요리",
  ingredient: "재료",
  convenience: "간편식",
};

/** 📖 도감 화면 — 실데이터. 먹었어요로 적립된 카드가 풀컬러로 뜬다 (리텐션 엔진, PRD 7장). */
export function CollectionScreen() {
  const [tab, setTab] = useState<CollectionTab>("recipe");
  const [selected, setSelected] = useState<CollectibleResponse | null>(null);
  const { data, isPending, isError } = useCollection(tab);

  const items = data?.items ?? [];
  const have = data?.acquired ?? 0;
  const total = data?.total ?? 0;
  const hiddenCount = total - items.length; // 그리드에 안 뜬(티저 밖) 미획득 수

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-title text-cocoa">도감</h1>
      <SegmentedControl
        options={[...COLLECTION_TABS]}
        value={tab}
        onChange={(v) => setTab(v as CollectionTab)}
      />

      {isError && <p className="px-1 text-sm text-cocoa-soft">로그인하면 도감을 모을 수 있어요.</p>}
      {!isError && (
        <>
          <CompleteGauge have={have} total={total} />
          {isPending ? (
            <p className="px-1 text-sm text-cocoa-faint">{messages.empty.collection}</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {items.map((i) => (
                  <CollectibleCard key={i.refId} item={i} onClick={() => setSelected(i)} />
                ))}
              </div>
              {hiddenCount > 0 && (
                <p className="px-1 text-center text-xs text-cocoa-faint">
                  그 밖에도 {hiddenCount.toLocaleString()}개의 요리가 기다려요 🍳
                </p>
              )}
            </>
          )}
          <RewardChest />
          <ShareButton tabLabel={TAB_LABEL[tab]} acquired={have} />
        </>
      )}

      <CardDetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
