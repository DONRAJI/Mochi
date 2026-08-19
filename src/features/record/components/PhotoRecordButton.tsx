"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { resizeImage } from "../photo";
import { useRecordPhoto } from "../hooks/useRecord";

/**
 * 사진 한 장으로 기록 (PRD 8-3, 비요리 사용자용) — 요리 없이 먹기→찍기→기록→모찌 칭찬.
 * 카메라/갤러리에서 한 장 → 클라 리사이즈 → 업로드 → 모찌 cheer. 숫자·죄책감 없음(불변 #1·#2).
 */
interface PhotoRecordButtonProps {
  /** 홈 빠른 액션 줄에 들어가는 아이콘 형태 — 성공 피드백은 토스트처럼 짧게 띄운다. */
  compact?: boolean;
}

export function PhotoRecordButton({ compact = false }: PhotoRecordButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const record = useRecordPhoto();
  // 방금 적립한 씨앗 + 뽑기 가능 여부(기록→뽑기 브릿지)
  const [earned, setEarned] = useState<{ seeds: number; canDraw: boolean } | null>(null);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 다시 고를 수 있게 초기화
    if (!file) return;
    const blob = await resizeImage(file);
    record.mutate(blob, {
      onSuccess: (r) => {
        setEarned({ seeds: r.seedsEarned, canDraw: r.canDraw });
        setTimeout(() => setEarned(null), 2500);
      },
    });
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      onChange={onPick}
      className="hidden"
    />
  );

  if (compact) {
    return (
      <>
        {input}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={record.isPending}
          aria-label="사진 한 장으로 기록"
          className="shrink-0 rounded-mochi bg-butter-soft px-4 text-lg shadow-mochi-press transition-transform ease-jelly active:scale-90"
        >
          {record.isPending ? "⏳" : "📷"}
        </button>
        {/* 좁은 버튼엔 결과를 못 담으니 화면 아래에 잠깐 띄우고 사라진다(2.5초). */}
        {(earned != null || record.isError) && (
          <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-5">
            <p className="rounded-mochi bg-cream-50 px-4 py-2 text-sm text-cocoa shadow-mochi">
              {earned != null
                ? `잘 먹었어요! 🌱 씨앗 +${earned.seeds}${earned.canDraw ? " · 🎁 뽑을 수 있어요!" : ""}`
                : "잠깐 안 됐어요. 다시 해볼까요?"}
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="w-full">
      {input}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={record.isPending}
        className="w-full rounded-mochi bg-butter-soft px-4 py-3 text-center text-sm text-cocoa shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
      >
        {record.isPending
          ? "올리는 중이에요… 📷"
          : earned != null
            ? `잘 먹었어요! 🌱 씨앗 +${earned.seeds}${earned.canDraw ? " · 🎁 뽑을 수 있어요!" : ""}`
            : "📷 사진 한 장으로 기록"}
      </button>
      {record.isError && (
        <p className="mt-1 text-center text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
      )}
    </div>
  );
}
