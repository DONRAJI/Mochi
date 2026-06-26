import { MochiAvatar } from "@/components/ui/MochiAvatar";
import { MochiSpeechBubble } from "@/components/ui/MochiSpeechBubble";

/** 로그인 — 라우트 그룹 (auth). 폼·로직은 추후 features/auth 로 (P0 골격). */
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-5">
      <MochiAvatar state="idle" />
      <MochiSpeechBubble>왔어요? 같이 시작해요.</MochiSpeechBubble>
    </main>
  );
}
