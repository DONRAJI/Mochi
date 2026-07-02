import { Card } from "@/components/ui/Card";

/** 컴플리트 보상함 — 스티커/모찌 옷/테마 (PRD 5.4·7.2). 보상 시스템은 준비 중이라 안내만(정직). */
export function RewardChest() {
  return (
    <Card className="flex items-center gap-3 bg-butter-soft">
      <span className="text-3xl">🎁</span>
      <div>
        <p className="font-medium text-cocoa">보상함</p>
        <p className="text-sm text-cocoa-faint">카테고리를 다 채우면 새 옷·테마가 열려요 (곧 만나요)</p>
      </div>
    </Card>
  );
}
