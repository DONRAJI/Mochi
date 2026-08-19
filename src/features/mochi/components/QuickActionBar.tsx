"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PhotoRecordButton } from "@/features/record/components/PhotoRecordButton";

/**
 * 빠른 액션 — [먹었어요]→식단 · [재료]→냉장고 · [📷]→사진 한 장 기록 (PRD 홈).
 *
 * 사진 기록은 홈 맨 아래 별도 줄이었는데, 셋 다 "지금 뭔가 한다"는 같은 성격이라
 * 한 줄로 합쳤다(홈 블록 수를 줄이는 정리의 일부). 사진은 아이콘만 두고 폭을 적게 차지하게.
 */
export function QuickActionBar() {
  const router = useRouter();
  return (
    <div className="flex w-full items-stretch gap-2">
      <Button className="flex-1" onClick={() => router.push("/meals")}>
        먹었어요
      </Button>
      <Button variant="soft" className="flex-1" onClick={() => router.push("/fridge")}>
        재료 추가
      </Button>
      <PhotoRecordButton compact />
    </div>
  );
}
