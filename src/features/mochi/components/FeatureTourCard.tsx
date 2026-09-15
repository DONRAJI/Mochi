"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useMochiState } from "../hooks/useMochi";
import {
  DISCOVERY_ITEMS,
  FEATURE_GUIDE_HREF,
  featureTourStorageKey,
  shouldShowFeatureTour,
  type DiscoveryItem,
} from "../featureGuide";
import { cn } from "@/lib/utils";

function readDismissed(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false; // 저장소를 못 쓰는 환경 — 이번 방문 동안만 닫힌다
  }
}

function writeDismissed(key: string): void {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // 저장 못 해도 화면에서는 닫는다
  }
}

/**
 * 첫 모찌 뒤 한 번 — 설명이 없어 안 쓰이던 기능(사진 기록·체중 기록·숫자도 보는 모드)을 짧게 소개.
 * 첫 안내(StartHereCard)가 사라지는 바로 그 시점에 같은 자리에 뜬다(featureGuide.ts).
 *
 * 닫은 기록은 기기에 계정별로(localStorage). 서버에 칸을 늘릴 만큼의 상태가 아니다.
 * 저장소는 마운트 뒤에만 읽는다 — 서버 렌더와 첫 클라 렌더를 같게(하이드레이션), 읽기 전엔 안 그린다.
 */
export function FeatureTourCard() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: mochi } = useMochiState();
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const storageKey = me ? featureTourStorageKey(me.id) : null;

  useEffect(() => {
    if (storageKey) setDismissed(readDismissed(storageKey));
  }, [storageKey]);

  if (!storageKey || !mochi || dismissed === null) return null;
  if (!shouldShowFeatureTour({ collectedCount: mochi.collectedCount, dismissed })) return null;

  function close() {
    if (storageKey) writeDismissed(storageKey);
    setDismissed(true);
  }

  return (
    <Card className="w-full bg-lavender-soft">
      <p className="font-display text-lg text-cocoa">첫 모찌를 만났네요! 이런 것도 있어요</p>
      <p className="mt-0.5 text-sm text-cocoa-soft">필요할 때 하나씩 써보면 돼요.</p>

      <div className="mt-3 flex flex-col gap-2">
        {DISCOVERY_ITEMS.map((item) => (
          <DiscoveryRow
            key={item.key}
            item={item}
            onClick={item.href ? () => router.push(item.href as string) : undefined}
          />
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="soft" className="flex-1" onClick={close}>
          알겠어요
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            close();
            router.push(FEATURE_GUIDE_HREF);
          }}
        >
          사용법 전부 보기
        </Button>
      </div>
    </Card>
  );
}

function DiscoveryRow({ item, onClick }: { item: DiscoveryItem; onClick?: () => void }) {
  const content = (
    <>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-200 text-sm">
        {item.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-cocoa">{item.label}</span>
        <span className="block truncate text-xs text-cocoa-faint">{item.hint}</span>
      </span>
      {onClick && <span className="shrink-0 text-cocoa-faint">›</span>}
    </>
  );
  const base = "flex items-center gap-3 rounded-mochi-sm bg-cream-50 px-3 py-2 text-left";
  if (!onClick) return <div className={base}>{content}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, "shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]")}
    >
      {content}
    </button>
  );
}
