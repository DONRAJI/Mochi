import { Suspense } from "react";
import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

/** 새 비밀번호 정하기 — 공개 페이지. useSearchParams를 쓰므로 Suspense로 감싼다(프리렌더 요건). */
export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5">
      <MochiAvatar state="idle" />
      <MochiSpeechBubble>새 비밀번호를 정해볼까요?</MochiSpeechBubble>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
