import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

/** 비밀번호 찾기 — 공개 페이지(미들웨어 매처 밖). */
export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5">
      <MochiAvatar state="idle" />
      <MochiSpeechBubble>괜찮아요, 누구나 잊어버려요.</MochiSpeechBubble>
      <ForgotPasswordForm />
    </main>
  );
}
