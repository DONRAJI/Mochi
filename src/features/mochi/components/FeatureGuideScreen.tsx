"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { FEATURE_GUIDE } from "../featureGuide";

/**
 * 📖 모찌 사용법 (마이 > 모찌 사용법, /me/guide) — 기능을 한곳에 모은 안내. 항목마다 그 화면으로 바로 간다.
 * 내용은 featureGuide.ts(첫 모찌 뒤 홈 소개 카드와 같은 출처).
 */
export function FeatureGuideScreen() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/me")}
          aria-label="마이로 돌아가기"
          className="rounded-mochi-sm px-2 py-1 text-cocoa-faint transition-transform ease-jelly active:scale-90"
        >
          ‹
        </button>
        <h1 className="text-title text-cocoa">모찌 사용법</h1>
      </div>

      <p className="px-1 text-sm text-cocoa-soft">
        전부 쓸 필요는 없어요. 마음에 드는 것만 골라 써도 모찌는 잘 자라요.
      </p>

      {FEATURE_GUIDE.map((section) => (
        <section key={section.key} className="flex flex-col gap-2">
          <p className="px-1 font-display text-cocoa">
            {section.emoji} {section.title}
          </p>
          {section.items.map((item) => (
            <Card key={item.key} className="flex flex-col gap-1.5">
              <p className="flex items-center gap-2 text-cocoa">
                <span className="text-xl">{item.emoji}</span>
                {item.title}
              </p>
              <p className="text-sm text-cocoa-soft">{item.body}</p>
              <button
                type="button"
                onClick={() => router.push(item.href)}
                className="self-start rounded-mochi-sm bg-cream-200 px-3 py-1 text-xs text-cocoa-soft transition-transform ease-jelly active:scale-95"
              >
                {item.where} ›
              </button>
            </Card>
          ))}
        </section>
      ))}
    </div>
  );
}
