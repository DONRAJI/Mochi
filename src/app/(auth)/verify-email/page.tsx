import { Suspense } from "react";
import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";
import { VerifyEmailScreen } from "@/features/auth/components/VerifyEmailScreen";

/** 이메일 인증 링크 도착지 — 공개 페이지. useSearchParams를 쓰므로 Suspense로 감싼다. */
export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5">
      <MochiAvatar state="happy" />
      <MochiSpeechBubble>이메일을 확인하는 중이에요.</MochiSpeechBubble>
      <Suspense fallback={null}>
        <VerifyEmailScreen />
      </Suspense>
    </main>
  );
}
