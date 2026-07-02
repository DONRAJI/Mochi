"use client";

import { Card } from "@/components/ui/Card";
import { useFavorites, useToggleFavorite } from "../hooks/useRecommend";

const MODE_LABEL: Record<"cook" | "eatout" | "convenience", string> = {
  cook: "요리",
  eatout: "외식",
  convenience: "간편식",
};

/** 즐겨찾기 목록 뷰 (#7) — 하트로 담은 항목을 모아 본다. 하트 다시 누르면 해제. */
export function FavoritesList() {
  const { data: favorites } = useFavorites();
  const toggle = useToggleFavorite();

  if (!favorites || favorites.length === 0) {
    return (
      <p className="px-1 text-sm text-cocoa-faint">
        아직 즐겨찾기가 없어요. 마음에 드는 걸 하트 ♡ 로 담아보세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {favorites.map((f) => (
        <Card key={f.id} className="flex items-center gap-3">
          <span className="text-2xl">{f.emoji ?? "🍽️"}</span>
          <div className="flex-1">
            <p className="font-display text-cocoa">{f.title}</p>
            <p className="text-xs text-cocoa-faint">{MODE_LABEL[f.mode]}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              toggle.mutate({ mode: f.mode, refId: f.refId, title: f.title, emoji: f.emoji ?? undefined })
            }
            aria-label="즐겨찾기 해제"
            className="text-xl text-peach-deep transition-transform ease-jelly active:scale-90"
          >
            ♥
          </button>
        </Card>
      ))}
    </div>
  );
}
