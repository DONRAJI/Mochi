import { Button } from "@/components/ui/Button";

/** 빠른 액션 — [먹었어요][재료 추가]. 동작 연결은 record/fridge 도메인에서 (스켈레톤). */
export function QuickActionBar() {
  return (
    <div className="flex w-full gap-3">
      <Button className="flex-1">먹었어요</Button>
      <Button variant="soft" className="flex-1">
        재료 추가
      </Button>
    </div>
  );
}
