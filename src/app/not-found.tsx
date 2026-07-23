import Link from "next/link";

/** 404 — 없는 경로. 모찌 보이스로 부드럽게 홈 유도(불변 #1). */
export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-5xl">🍮</span>
      <p className="font-display text-lg text-cocoa">여긴 아직 비어 있어요</p>
      <p className="text-sm text-cocoa-soft">찾는 걸 못 찾았어요. 홈에서 다시 시작해볼까요?</p>
      <Link
        href="/"
        className="rounded-mochi bg-mint px-5 py-2.5 text-cocoa shadow-mochi-press transition-transform ease-jelly active:scale-95"
      >
        홈으로
      </Link>
    </main>
  );
}
