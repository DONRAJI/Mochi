"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLogin } from "../hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true); // 기본 유지 — 껐다 켜도 로그인 유지

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    login.mutate({ email, password, remember }, { onSuccess: () => router.push("/") });
  }

  return (
    <Card className="w-full">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="이메일"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="비밀번호"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setRemember((r) => !r)}
          aria-pressed={remember}
          className="flex items-center gap-2 self-start text-sm text-cocoa-soft"
        >
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-mochi-sm text-xs transition-transform ease-jelly active:scale-90",
              remember ? "bg-mint text-cocoa" : "bg-cream-200",
            )}
          >
            {remember ? "✓" : ""}
          </span>
          로그인 유지
        </button>
        {login.isError && <p className="text-sm text-cocoa-soft">{(login.error as Error).message}</p>}
        <Button type="submit" className="w-full">
          {login.isPending ? "들어가는 중…" : "로그인"}
        </Button>
      </form>
      <p className="mt-3 text-center text-sm text-cocoa-faint">
        <Link href="/forgot-password" className="text-cocoa-soft underline">
          비밀번호를 잊었어요
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-cocoa-faint">
        처음이세요?{" "}
        <Link href="/signup" className="text-cocoa underline">
          가입하기
        </Link>
      </p>
    </Card>
  );
}
