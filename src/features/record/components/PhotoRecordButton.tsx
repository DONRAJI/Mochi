"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { resizeImage } from "../photo";
import { useRecordPhoto } from "../hooks/useRecord";

/**
 * 사진 한 장으로 기록 (PRD 8-3, 비요리 사용자용) — 요리 없이 먹기→찍기→기록→모찌 칭찬.
 * 카메라/갤러리에서 한 장 → 클라 리사이즈 → 업로드 → 모찌 cheer. 숫자·죄책감 없음(불변 #1·#2).
 */
export function PhotoRecordButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const record = useRecordPhoto();
  const [done, setDone] = useState(false);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 다시 고를 수 있게 초기화
    if (!file) return;
    const blob = await resizeImage(file);
    record.mutate(blob, {
      onSuccess: () => {
        setDone(true);
        setTimeout(() => setDone(false), 2500);
      },
    });
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={record.isPending}
        className="w-full rounded-mochi bg-butter-soft px-4 py-3 text-center text-sm text-cocoa shadow-mochi-press transition-transform ease-jelly active:scale-[0.98]"
      >
        {record.isPending
          ? "올리는 중이에요… 📷"
          : done
            ? "잘 먹었어요! 📷✨"
            : "📷 사진 한 장으로 기록"}
      </button>
      {record.isError && (
        <p className="mt-1 text-center text-sm text-cocoa-soft">잠깐 안 됐어요. 다시 해볼까요?</p>
      )}
    </div>
  );
}
