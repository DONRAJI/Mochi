import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";
import { SignupForm } from "@/features/auth/components/SignupForm";

/** 회원가입 + 가벼운 온보딩 — 체중/목표 입력은 요구하지 않는다 (PRD 4.1 죄책감 제로). */
export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5 py-10">
      <MochiAvatar state="happy" />
      <MochiSpeechBubble>반가워요! 몇 가지만 알려줄래요?</MochiSpeechBubble>
      <SignupForm />
    </main>
  );
}
