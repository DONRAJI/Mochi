import { Card } from "@/components/ui/Card";
import { messages } from "@/lib/messages";

/** 📖 도감 — 리텐션 엔진. 요리/재료/간편식 수집 (PRD 7장). */
export default function CollectionPage() {
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">도감</h1>
      <Card>
        <p className="text-cocoa-soft">{messages.empty.collection}</p>
      </Card>
    </main>
  );
}
