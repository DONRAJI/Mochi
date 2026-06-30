"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

/** 빠른 액션 — [먹었어요]→식단, [재료 추가]→냉장고 (PRD 홈). */
export function QuickActionBar() {
  const router = useRouter();
  return (
    <div className="flex w-full gap-3">
      <Button className="flex-1" onClick={() => router.push("/meals")}>
        먹었어요
      </Button>
      <Button variant="soft" className="flex-1" onClick={() => router.push("/fridge")}>
        재료 추가
      </Button>
    </div>
  );
}
