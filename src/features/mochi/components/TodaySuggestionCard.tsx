"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { useRecommendations } from "@/features/recommend/hooks/useRecommend";
import type { RecommendationResponse } from "@/features/recommend/types";

const TONES = ["bg-peach-soft", "bg-mint-soft", "bg-lavender-soft"] as const;

function hintFor(r: RecommendationResponse): string {
  if (r.matchRate != null && r.matchRate > 0) return `냉장고 ${r.matchRate}% 매칭`;
  if (r.usesExpiring) return "임박 재료로 딱";
  return r.badge ?? "오늘 이거 어때요?";
}

/** 오늘의 제안 — 실제 요리 추천 상위 3(냉장고·취향 반영). 탭하면 그 메뉴 상세가 바로 열린다 (PRD 4.2 30초 완결). */
export function TodaySuggestionCard() {
  const { data } = useRecommendations("cook");
  const top = (data ?? []).slice(0, 3);

  if (top.length === 0) return null;

  return (
    <section className="w-full">
      <p className="mb-2 text-sm text-cocoa-faint">오늘의 제안</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {top.map((r, i) => (
          <Link key={r.id} href={`/meals?open=${encodeURIComponent(r.id)}`} className="min-w-[78%]">
            <Card className={TONES[i % TONES.length]}>
              <div className="flex items-center gap-3">
                {r.imageUrl ? (
                  <Image
                    src={r.imageUrl}
                    alt={r.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-mochi-sm object-cover"
                  />
                ) : (
                  <span className="text-3xl">{r.emoji ?? "🍽️"}</span>
                )}
                <div>
                  <p className="font-display text-lg text-cocoa">{r.name}</p>
                  <p className="text-sm text-cocoa-soft">{hintFor(r)}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
