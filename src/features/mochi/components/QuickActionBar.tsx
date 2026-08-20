"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PhotoRecordButton } from "@/features/record/components/PhotoRecordButton";
import { QuickRecordSheet } from "@/features/record/components/QuickRecordSheet";

/**
 * 빠른 액션 — [먹었어요]→직접 입력 · [재료]→냉장고 · [📷]→사진 한 장 기록 (PRD 홈).
 *
 * 사진 기록은 홈 맨 아래 별도 줄이었는데, 셋 다 "지금 뭔가 한다"는 같은 성격이라
 * 한 줄로 합쳤다(홈 블록 수를 줄이는 정리의 일부). 사진은 아이콘만 두고 폭을 적게 차지하게.
 *
 * '먹었어요'는 예전엔 식단 탭으로 보내기만 했다 — 버튼 이름과 달리 기록이 아니라 이동이었고,
 * 카탈로그에 없는 음식(밖에서 사 먹은 것·간식)은 남길 방법이 아예 없었다. 이제 그 자리에서
 * 바로 적는다. 목록에서 고르고 싶으면 시트 안의 링크로 식단 탭에 간다.
 */
export function QuickActionBar() {
  const router = useRouter();
  const [recordOpen, setRecordOpen] = useState(false);
  return (
    <div className="flex w-full items-stretch gap-2">
      <Button className="flex-1" onClick={() => setRecordOpen(true)}>
        먹었어요
      </Button>
      <Button variant="soft" className="flex-1" onClick={() => router.push("/fridge")}>
        재료 추가
      </Button>
      <PhotoRecordButton compact />
      <QuickRecordSheet open={recordOpen} onClose={() => setRecordOpen(false)} />
    </div>
  );
}
