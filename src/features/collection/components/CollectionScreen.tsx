"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CompleteGauge } from "./CompleteGauge";
import { CollectibleCard } from "./CollectibleCard";
import { CardDetailModal } from "./CardDetailModal";
import { RewardChest } from "./RewardChest";
import { useCollection } from "../hooks/useCollection";
import { COLLECTION_TABS } from "../data";
import type { CollectionTab, CollectibleResponse } from "../types";
import { messages } from "@/lib/messages";

/** 📖 도감 화면 — 실데이터. 먹었어요로 적립된 카드가 풀컬러로 뜬다 (리텐션 엔진, PRD 7장). */
export function CollectionScreen() {
  const [tab, setTab] = useState<CollectionTab>("recipe");
  const [selected, setSelected] = useState<CollectibleResponse | null>(null);
  const { data, isPending, isError } = useCollection(tab);

  const items = data ?? [];
  const have = items.filter((i) => i.acquired).length;

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
          <CompleteGauge have={have} total={items.length} />
          {isPending ? (
            <p className="px-1 text-sm text-cocoa-faint">{messages.empty.collection}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map((i) => (
                <CollectibleCard key={i.refId} item={i} onClick={() => setSelected(i)} />
              ))}
            </div>
          )}
          <RewardChest />
        </>
      )}

      <CardDetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
