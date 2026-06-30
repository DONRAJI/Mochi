import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";
import { LoginForm } from "@/features/auth/components/LoginForm";

/** 로그인 — 라우트 그룹 (auth). */
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5">
      <MochiAvatar state="idle" />
      <MochiSpeechBubble>왔어요? 같이 시작해요.</MochiSpeechBubble>
      <LoginForm />
    </main>
  );
}
