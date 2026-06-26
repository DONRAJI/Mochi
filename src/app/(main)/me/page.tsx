import { Card } from "@/components/ui/Card";

/**
 * 👤 마이 — 기록·더보기. 숫자(체중·칼로리·달성률)는 **오직 여기** '더보기' 안에만 (불변 #2).
 */
export default function MePage() {
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">마이</h1>
      <Card>
        <p className="text-cocoa-soft">체중 기록·통계는 여기 &lsquo;더보기&rsquo;에서 원할 때만 봐요.</p>
      </Card>
    </main>
  );
}
