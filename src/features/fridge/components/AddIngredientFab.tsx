"use client";

import { Fab } from "@/components/ui/Fab";

/** 재료 추가 FAB → 입력 방식 시트 오픈 (PRD 5.2). */
export function AddIngredientFab({ onClick }: { onClick: () => void }) {
  return (
    <Fab onClick={onClick} aria-label="재료 추가">
      ＋
    </Fab>
  );
}
