"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useForgotPassword } from "../hooks/useAuth";

/**
 * 비밀번호 찾기 — 메일로 재설정 링크를 보낸다.
 *
 * ⚠️ 성공 화면은 **계정이 있든 없든 똑같다.** "그런 계정 없어요"라고 알려주면 남의 이메일이
 * 가입돼 있는지 확인하는 도구가 된다(사용자 열거). 서버도 같은 응답을 준다.
 */
export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const [email, setEmail] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (forgot.isPending) return;
    forgot.mutate(email.trim());
  }

  if (forgot.isSuccess) {
    return (
      <Card className="w-full text-center">
        <p className="font-display text-lg text-cocoa">메일을 보냈어요 💌</p>
        <p className="mt-2 text-sm text-cocoa-soft">
          그 주소로 가입한 계정이 있다면 재설정 링크가 도착해요.
          <br />
          받은편지함에 없으면 스팸함도 한 번 봐주세요.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm text-cocoa underline">
          로그인으로 돌아가기
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <p className="text-sm text-cocoa-soft">
          가입한 이메일을 알려주시면 새 비밀번호를 정하는 링크를 보내드려요.
        </p>
        <Input
          type="email"
          placeholder="이메일"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {forgot.isError && (
          <p className="text-sm text-cocoa-soft">{(forgot.error as Error).message}</p>
        )}
        <Button type="submit" className="w-full">
          {forgot.isPending ? "보내는 중…" : "재설정 링크 받기"}
        </Button>
      </form>
      <p className="mt-3 text-center text-sm text-cocoa-faint">
        생각났어요?{" "}
        <Link href="/login" className="text-cocoa underline">
          로그인
        </Link>
      </p>
    </Card>
  );
}
