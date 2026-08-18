"use client";

import { useState } from "react";
import { buildShareText } from "../share";

/** 도감 자랑하기 (PRD 7.3#7) — Web Share API, 없으면 클립보드 복사. */
export function ShareButton({ tabLabel, acquired }: { tabLabel: string; acquired: number }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    // 지금 떠 있는 주소가 곧 정답 — env로 박아두면 프리뷰 배포·도메인 변경 때 틀린 링크가 나간다.
    // (클릭 핸들러 안이라 window는 항상 있다. 메일 링크용 서버 기준 주소는 server/email/send.ts.)
    const text = buildShareText(tabLabel, acquired, window.location.origin);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "모찌 도감", text });
      } catch {
        // 사용자가 공유를 취소함 — 무시
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="rounded-mochi bg-lavender-soft px-4 py-2.5 text-center text-sm text-cocoa shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
    >
      {copied ? "복사됐어요, 붙여넣어 자랑해요 ✓" : "📤 도감 자랑하기"}
    </button>
  );
}
