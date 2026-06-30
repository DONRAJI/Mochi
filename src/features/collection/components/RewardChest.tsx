import { Card } from "@/components/ui/Card";

/** 컴플리트 보상함 — 스티커/모찌 옷/테마 (PRD 5.4·7.2). */
export function RewardChest() {
  return (
    <Card className="flex items-center justify-between bg-butter-soft">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🎁</span>
        <div>
          <p className="font-medium text-cocoa">보상함</p>
          <p className="text-sm text-cocoa-faint">카테고리를 채우면 새 옷·테마가 톡!</p>
        </div>
      </div>
      <span className="rounded-mochi-sm bg-butter-deep px-3 py-1 text-sm text-cocoa">열기</span>
    </Card>
  );
}
