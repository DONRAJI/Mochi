"use client";

import { useEffect } from "react";

/**
 * 전역 에러 바운더리 (App Router) — 렌더 중 에러가 나도 흰 화면 대신 모찌 보이스로 안내.
 * 죄책감 제로(불변 #1): 거친 단어 없이 부드럽게, 다시 시도 버튼 제공.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error); // 서버/모니터링 로그용 (사용자에겐 부드러운 화면만)
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-5xl">🧊</span>
      <p className="font-display text-lg text-cocoa">잠깐 쉬어가는 중이에요</p>
      <p className="text-sm text-cocoa-soft">모찌가 금방 정리할게요. 다시 해볼까요?</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-mochi bg-mint px-5 py-2.5 text-cocoa shadow-mochi-press transition-transform ease-jelly active:scale-95"
      >
        다시 시도
      </button>
    </main>
  );
}
