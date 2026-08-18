"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useResetPassword } from "../hooks/useAuth";

/**
 * 메일 링크로 새 비밀번호 정하기. 성공하면 서버가 이 계정의 **모든 세션을 폐기**하므로,
 * 다른 기기에 남아 있던 로그인도 끊긴다(계정을 되찾는 흐름이라 그게 맞다) → 다시 로그인.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const reset = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 8 && password === confirm && !!token;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || reset.isPending) return;
    reset.mutate({ token, password });
  }

  if (!token) {
    return (
      <Card className="w-full text-center">
        <p className="font-display text-lg text-cocoa">링크가 완전하지 않아요</p>
        <p className="mt-2 text-sm text-cocoa-soft">메일의 링크를 다시 눌러볼까요?</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm text-cocoa underline">
          링크 다시 받기
        </Link>
      </Card>
    );
  }

  if (reset.isSuccess) {
    return (
      <Card className="w-full text-center">
        <p className="font-display text-lg text-cocoa">새 비밀번호로 바꿨어요 🌿</p>
        <p className="mt-2 text-sm text-cocoa-soft">
          안전을 위해 다른 기기의 로그인은 정리했어요. 다시 로그인해 주세요.
        </p>
        <Button className="mt-4 w-full" onClick={() => router.replace("/login")}>
          로그인하러 가기
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <p className="text-sm text-cocoa-soft">새로 쓸 비밀번호를 정해주세요.</p>
        <Input
          type="password"
          placeholder="새 비밀번호 (8자 이상)"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="한 번 더 입력"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {tooShort && <p className="text-sm text-cocoa-soft">비밀번호는 8자 이상이면 좋아요.</p>}
        {mismatch && <p className="text-sm text-cocoa-soft">두 번째 입력이 조금 다른 것 같아요.</p>}
        {reset.isError && (
          <p className="text-sm text-cocoa-soft">{(reset.error as Error).message}</p>
        )}
        <Button type="submit" className={canSubmit ? "w-full" : "w-full opacity-60"}>
          {reset.isPending ? "바꾸는 중…" : "비밀번호 바꾸기"}
        </Button>
      </form>
    </Card>
  );
}
