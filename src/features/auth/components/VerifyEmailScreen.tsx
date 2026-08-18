"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useVerifyEmail } from "../hooks/useAuth";

/**
 * 메일의 인증 링크가 도착하는 곳 — 열자마자 자동으로 처리한다.
 * 로그인 없이도 동작한다(메일을 다른 기기에서 열 수 있으므로). 토큰 자체가 소유 증명.
 */
export function VerifyEmailScreen() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const verify = useVerifyEmail();
  // React 18 StrictMode·리렌더로 두 번 호출되지 않게 — 토큰은 1회용이라 두 번째는 실패한다.
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    verify.mutate(token);
  }, [token, verify]);

  if (!token) {
    return (
      <Card className="w-full text-center">
        <p className="font-display text-lg text-cocoa">링크가 완전하지 않아요</p>
        <p className="mt-2 text-sm text-cocoa-soft">메일의 링크를 다시 눌러볼까요?</p>
      </Card>
    );
  }

  if (verify.isSuccess) {
    return (
      <Card className="w-full text-center">
        <p className="font-display text-lg text-cocoa">이메일을 확인했어요 ✅</p>
        <p className="mt-2 text-sm text-cocoa-soft">
          이제 비밀번호를 잊어도 이 주소로 다시 찾을 수 있어요.
        </p>
        <Button className="mt-4 w-full" onClick={() => router.replace("/")}>
          모찌에게 가기
        </Button>
      </Card>
    );
  }

  if (verify.isError) {
    return (
      <Card className="w-full text-center">
        <p className="font-display text-lg text-cocoa">링크가 오래됐나 봐요</p>
        <p className="mt-2 text-sm text-cocoa-soft">
          마이 &gt; 설정에서 인증 메일을 다시 보낼 수 있어요.
        </p>
        <Link href="/me/settings" className="mt-4 inline-block text-sm text-cocoa underline">
          설정으로 가기
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full text-center">
      <p className="text-sm text-cocoa-soft">확인하는 중이에요…</p>
    </Card>
  );
}
