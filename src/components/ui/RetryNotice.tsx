"use client";

import { messages } from "@/lib/messages";

interface RetryNoticeProps {
  onRetry: () => void;
  message?: string;
}

/**
 * 잠깐 못 불러왔을 때의 부드러운 안내 + 다시 시도 (불변 #1: 빨강·"실패" 문구 없음).
 *
 * 왜 필요한가: 지금까지는 조회가 실패하면 화면이 그냥 비어 있거나 안내 문구만 떠서
 * 사용자가 **스스로 빠져나올 방법이 없었다**(재시도 수단 없음 + `retry:1`). 네트워크가
 * 잠깐 끊기거나 서버가 깨어나는 중일 때 이 버튼 하나로 복구된다.
 */
export function RetryNotice({ onRetry, message }: RetryNoticeProps) {
  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-mochi bg-butter-soft px-4 py-3">
      <p className="text-sm text-cocoa-soft">{message ?? messages.retry.notice}</p>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-mochi-sm bg-butter px-3 py-1.5 text-sm text-cocoa shadow-mochi-press transition-transform ease-jelly active:scale-90"
      >
        {messages.retry.action}
      </button>
    </div>
  );
}
