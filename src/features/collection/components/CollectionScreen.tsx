"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CompleteGauge } from "./CompleteGauge";
import { CollectibleCard } from "./CollectibleCard";
import { CardDetailModal } from "./CardDetailModal";
import { RewardChest } from "./RewardChest";
import {
  COLLECTION_TABS,
  MOCK_COLLECTION,
  type CollectionTab,
  type MockCollectible,
} from "../data";

/** 📖 도감 화면 — 책장 탭 + 수집 그리드 (리텐션 엔진, PRD 5.4·7장). */
export function CollectionScreen() {
  const [tab, setTab] = useState<CollectionTab>("recipe");
  const [selected, setSelected] = useState<MockCollectible | null>(null);
  const items = MOCK_COLLECTION[tab];
  const have = items.filter((i) => i.acquired).length;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-cocoa">도감</h1>
      <SegmentedControl
        options={[...COLLECTION_TABS]}
        value={tab}
        onChange={(v) => setTab(v as CollectionTab)}
      />
      <CompleteGauge have={have} total={items.length} />
      <div className="grid grid-cols-3 gap-2">
        {items.map((i) => (
          <CollectibleCard key={i.id} item={i} onClick={() => setSelected(i)} />
        ))}
      </div>
      <RewardChest />
      <CardDetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
